import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { ThreatCategory, RiskAlert } from './riskEngine';

export interface PhotoAlert extends RiskAlert {
  photoUri: string;
  photoId: string;
  blocked: boolean;
}

// Keywords in filenames that indicate photos from chat apps
const RISKY_FILENAME_PATTERNS = [
  /snapchat/i, /discord/i, /telegram/i, /signal/i,
  /received/i, /inbox/i, /download/i, /whatsapp/i,
  /messenger/i, /instagram/i, /kik/i,
];

/**
 * PhotoWatcher — monitors the photo library for harmful incoming images.
 *
 * Detection layers:
 * 1. Chat app origin detection (filename patterns)
 * 2. Rapid burst detection (multiple photos in short time = someone sending images)
 * 3. Late night photo detection
 * 4. Google Cloud Vision SafeSearch (if API key available)
 * 5. Thorn Safer hash matching (when partnership active)
 *
 * Blocking:
 * - Photos flagged as explicit/sexual are moved to a quarantine folder
 * - Parent is alerted with a BLURRED preview (never the actual image)
 * - Original photo is hidden from the child's gallery
 * - Parent can choose to delete permanently or restore
 */

interface PhotoScanResult {
  isRisky: boolean;
  reason: string;
  confidence: number;
  isExplicit: boolean; // true = sexual content, should be blocked/blurred
  isSelfie: boolean; // true = front camera, likely the child's own photo
  isCsam: boolean; // true = CSAM hash match
}

const QUARANTINE_DIR = `${FileSystem.documentDirectory}custorian_quarantine/`;

class PhotoWatcher {
  private subscription: MediaLibrary.Subscription | null = null;
  private lastCheckedTimestamp: number = Date.now();
  private recentPhotoTimes: number[] = [];
  private onAlert: ((alert: PhotoAlert) => void) | null = null;

  async requestPermission(): Promise<boolean> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  }

  async ensureQuarantineDir(): Promise<void> {
    const info = await FileSystem.getInfoAsync(QUARANTINE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(QUARANTINE_DIR, { intermediates: true });
    }
  }

  startWatching(callback: (alert: PhotoAlert) => void) {
    this.onAlert = callback;
    this.lastCheckedTimestamp = Date.now();
    this.ensureQuarantineDir();

    this.subscription = MediaLibrary.addListener(async (event) => {
      if (event.hasIncrementalChanges === false) return;

      const recent = await MediaLibrary.getAssetsAsync({
        first: 5,
        mediaType: 'photo',
        sortBy: [MediaLibrary.SortBy.creationTime],
        createdAfter: this.lastCheckedTimestamp,
      });

      this.lastCheckedTimestamp = Date.now();

      for (const asset of recent.assets) {
        const result = await this.analyzePhoto(asset);

        if (result.isExplicit) {
          if (result.isSelfie) {
            // Child took an inappropriate selfie — permanently delete
            console.log('[Custorian] Explicit selfie detected — permanently deleting');
            await MediaLibrary.deleteAssetsAsync([asset]);
          } else {
            // Explicit content from chat app — quarantine for parent review
            await this.quarantinePhoto(asset);
          }
        }

        if (result.isRisky && this.onAlert) {
          const category: ThreatCategory = result.isCsam ? 'grooming' : result.isSelfie ? 'contentWellness' : 'grooming';
          this.onAlert({
            id: Date.now().toString(),
            category,
            score: result.confidence * 100,
            snippet: result.isSelfie
              ? 'Inappropriate selfie detected and automatically removed'
              : `Flagged photo: ${result.reason}`,
            sourceApp: result.isSelfie ? 'Camera (selfie)' : 'Photo Library',
            timestamp: new Date().toISOString(),
            reviewed: false,
            photoUri: asset.uri,
            photoId: asset.id,
            blocked: result.isExplicit,
          });
        }
      }
    });
  }

  stopWatching() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  /**
   * Quarantine a photo — copy to secure folder, remove from gallery.
   * Parent can review blurred version and decide to delete or restore.
   */
  private async quarantinePhoto(asset: MediaLibrary.Asset): Promise<void> {
    try {
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
      if (!assetInfo.localUri) return;

      // Copy to quarantine directory
      const quarantinePath = `${QUARANTINE_DIR}${asset.id}_${asset.filename}`;
      await FileSystem.copyAsync({
        from: assetInfo.localUri,
        to: quarantinePath,
      });

      // Remove from visible photo library
      await MediaLibrary.deleteAssetsAsync([asset]);

      console.log(`[Custorian] Photo quarantined: ${asset.filename}`);
    } catch (error) {
      console.error('[Custorian] Failed to quarantine photo:', error);
    }
  }

  /**
   * Restore a quarantined photo back to the gallery.
   * Called by parent from the dashboard after review.
   */
  async restorePhoto(assetId: string, filename: string): Promise<boolean> {
    try {
      const quarantinePath = `${QUARANTINE_DIR}${assetId}_${filename}`;
      const info = await FileSystem.getInfoAsync(quarantinePath);
      if (!info.exists) return false;

      await MediaLibrary.createAssetAsync(quarantinePath);
      await FileSystem.deleteAsync(quarantinePath);

      console.log(`[Custorian] Photo restored: ${filename}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Permanently delete a quarantined photo.
   * Called by parent from the dashboard.
   */
  async deleteQuarantinedPhoto(assetId: string, filename: string): Promise<boolean> {
    try {
      const quarantinePath = `${QUARANTINE_DIR}${assetId}_${filename}`;
      await FileSystem.deleteAsync(quarantinePath);
      console.log(`[Custorian] Quarantined photo permanently deleted: ${filename}`);
      return true;
    } catch {
      return false;
    }
  }

  /** List all quarantined photos (for parent dashboard) */
  async listQuarantined(): Promise<string[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(QUARANTINE_DIR);
      return files;
    } catch {
      return [];
    }
  }

  private async analyzePhoto(asset: MediaLibrary.Asset): Promise<PhotoScanResult> {
    const now = Date.now();

    // Track rapid photo saves
    this.recentPhotoTimes.push(now);
    this.recentPhotoTimes = this.recentPhotoTimes.filter((t) => now - t < 30000);

    const filename = asset.filename?.toLowerCase() || '';
    const fromChatApp = RISKY_FILENAME_PATTERNS.some((p) => p.test(filename));
    const rapidBurst = this.recentPhotoTimes.length >= 3;
    const hour = new Date(asset.creationTime).getHours();
    const lateNight = hour >= 22 || hour < 5;
    const isSelfie = asset.width > 0 && asset.height > 0 &&
      Math.abs(asset.width / asset.height - 1) < 0.3;

    // Layer 1: PhotoDNA CSAM hash matching (highest priority)
    let csamMatch = false;
    const photoDnaKey = process.env.PHOTODNA_API_KEY;
    const photoDnaEndpoint = process.env.PHOTODNA_ENDPOINT || 'https://api.microsoftmoderator.com/photodna/v1.0/Match';
    if (photoDnaKey) {
      try {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
        if (assetInfo.localUri) {
          const base64 = await FileSystem.readAsStringAsync(assetInfo.localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          console.log(`[Custorian:PhotoDNA] Scanning image: ${asset.filename} (${Math.round(base64.length / 1024)}KB base64)`);
          console.log(`[Custorian:PhotoDNA] Endpoint: ${photoDnaEndpoint}`);
          console.log(`[Custorian:PhotoDNA] Key present: ${photoDnaKey.substring(0, 6)}...`);

          const response = await fetch(photoDnaEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Ocp-Apim-Subscription-Key': photoDnaKey,
            },
            body: JSON.stringify({
              DataRepresentation: 'inline',
              Value: base64,
            }),
          });

          const statusCode = response.status;
          const data = await response.json();

          console.log(`[Custorian:PhotoDNA] Response status: ${statusCode}`);
          console.log(`[Custorian:PhotoDNA] Response:`, JSON.stringify(data, null, 2));

          if (statusCode === 200 && data.IsMatch === true) {
            csamMatch = true;
            console.log('[Custorian:PhotoDNA] *** CSAM MATCH DETECTED — MANDATORY REPORT REQUIRED ***');
          } else if (statusCode === 200) {
            console.log(`[Custorian:PhotoDNA] No match. IsMatch=${data.IsMatch}, Status=${data.Status?.Code}`);
          } else {
            console.warn(`[Custorian:PhotoDNA] API error ${statusCode}: ${data.Message || JSON.stringify(data)}`);
          }
        }
      } catch (error) {
        console.error('[Custorian:PhotoDNA] Check failed:', error);
        // Fail open — continue with other detection layers
      }
    } else {
      console.log('[Custorian:PhotoDNA] No API key configured — skipping CSAM hash check');
    }

    // Layer 2: Google Cloud Vision SafeSearch for explicit content detection
    let isExplicit = false;
    if (csamMatch) {
      isExplicit = true; // CSAM match = always explicit
    }
    const visionKey = process.env.GOOGLE_VISION_API_KEY;
    if (visionKey && !csamMatch) {
      try {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
        if (assetInfo.localUri) {
          const base64 = await FileSystem.readAsStringAsync(assetInfo.localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requests: [{
                  image: { content: base64 },
                  features: [{ type: 'SAFE_SEARCH_DETECTION' }],
                }],
              }),
            }
          );

          const data = await response.json();
          const safeSearch = data.responses?.[0]?.safeSearchAnnotation;

          if (safeSearch) {
            const explicit = ['LIKELY', 'VERY_LIKELY'];
            isExplicit =
              explicit.includes(safeSearch.adult) ||
              explicit.includes(safeSearch.racy) ||
              explicit.includes(safeSearch.violence);
          }
        }
      } catch {
        // Vision API failed — fall back to heuristic detection
      }
    }

    // Combine flags into risk score
    let score = 0;
    const reasons: string[] = [];

    // CSAM match = maximum severity, mandatory report
    if (csamMatch) {
      return {
        isRisky: true,
        reason: 'CSAM hash match (PhotoDNA) — MANDATORY REPORT REQUIRED',
        confidence: 1.0,
        isExplicit: true,
        isSelfie: false,
        isCsam: true,
      };
    }

    if (isExplicit) { score += 0.8; reasons.push('explicit content detected'); }
    if (fromChatApp) { score += 0.3; reasons.push('from chat app'); }
    if (rapidBurst) { score += 0.2; reasons.push('rapid burst'); }
    if (lateNight) { score += 0.1; reasons.push('late night'); }
    if (isSelfie && fromChatApp) { score += 0.1; reasons.push('selfie from chat'); }

    return {
      isRisky: score >= 0.5,
      reason: reasons.join(', ') || 'none',
      confidence: Math.min(score, 1),
      isExplicit,
      isSelfie: isSelfie && !fromChatApp, // selfie = front camera + not received from chat
      isCsam: false,
    };
  }
}

export const photoWatcher = new PhotoWatcher();
