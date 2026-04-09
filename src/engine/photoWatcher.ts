import * as MediaLibrary from 'expo-media-library';
import { ThreatCategory, RiskAlert } from './riskEngine';

export interface PhotoAlert extends RiskAlert {
  photoUri: string;
  photoId: string;
}

// Keywords in filenames that may indicate risk (received via chat apps)
const RISKY_FILENAME_PATTERNS = [
  /snapchat/i, /discord/i, /telegram/i, /signal/i,
  /received/i, /inbox/i, /download/i,
];

// On-device NSFW classification using basic heuristics for MVP.
// In production, replace with a real on-device ML model (e.g., NSFWJS via TFLite).
// This MVP version flags photos from chat apps and recent rapid photo saves.

interface PhotoScanResult {
  isRisky: boolean;
  reason: string;
  confidence: number;
}

class PhotoWatcher {
  private subscription: MediaLibrary.Subscription | null = null;
  private lastCheckedTimestamp: number = Date.now();
  private recentPhotoTimes: number[] = [];
  private onAlert: ((alert: PhotoAlert) => void) | null = null;

  async requestPermission(): Promise<boolean> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  }

  startWatching(callback: (alert: PhotoAlert) => void) {
    this.onAlert = callback;
    this.lastCheckedTimestamp = Date.now();

    this.subscription = MediaLibrary.addListener(async (event) => {
      if (event.hasIncrementalChanges === false) return;

      // Check for newly added photos
      const recent = await MediaLibrary.getAssetsAsync({
        first: 5,
        mediaType: 'photo',
        sortBy: [MediaLibrary.SortBy.creationTime],
        createdAfter: this.lastCheckedTimestamp,
      });

      this.lastCheckedTimestamp = Date.now();

      for (const asset of recent.assets) {
        const result = await this.analyzePhoto(asset);
        if (result.isRisky && this.onAlert) {
          this.onAlert({
            id: Date.now().toString(),
            category: 'grooming' as ThreatCategory,
            score: result.confidence * 100,
            snippet: `Flagged photo: ${result.reason}`,
            sourceApp: 'Photo Library',
            timestamp: new Date().toISOString(),
            reviewed: false,
            photoUri: asset.uri,
            photoId: asset.id,
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

  private async analyzePhoto(asset: MediaLibrary.Asset): Promise<PhotoScanResult> {
    const now = Date.now();

    // Track rapid photo saves (burst of received images from chat)
    this.recentPhotoTimes.push(now);
    this.recentPhotoTimes = this.recentPhotoTimes.filter((t) => now - t < 30000);

    // Flag 1: Photo from a chat app directory
    const filename = asset.filename?.toLowerCase() || '';
    const fromChatApp = RISKY_FILENAME_PATTERNS.some((p) => p.test(filename));

    // Flag 2: Rapid burst of new photos (someone sending multiple pics)
    const rapidBurst = this.recentPhotoTimes.length >= 3;

    // Flag 3: Photo taken very late at night (22:00-05:00)
    const hour = new Date(asset.creationTime).getHours();
    const lateNight = hour >= 22 || hour < 5;

    // Flag 4: Photo dimensions suggest selfie (roughly square, front camera aspect)
    const isSelfie = asset.width > 0 && asset.height > 0 &&
      Math.abs(asset.width / asset.height - 1) < 0.3;

    // Combine flags into risk score
    let score = 0;
    const reasons: string[] = [];

    if (fromChatApp) { score += 0.4; reasons.push('from chat app'); }
    if (rapidBurst) { score += 0.2; reasons.push('rapid burst'); }
    if (lateNight) { score += 0.2; reasons.push('late night'); }
    if (isSelfie && fromChatApp) { score += 0.2; reasons.push('selfie from chat'); }

    return {
      isRisky: score >= 0.6,
      reason: reasons.join(', ') || 'none',
      confidence: Math.min(score, 1),
    };
  }
}

export const photoWatcher = new PhotoWatcher();
