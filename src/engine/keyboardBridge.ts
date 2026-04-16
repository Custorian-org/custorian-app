import { Platform, NativeModules } from 'react-native';
import { RiskAlert, ThreatCategory, createAlert } from './riskEngine';
import { syncAlertToFamily } from './familySync';
import { logScanEvent, logIntervention } from '../lib/analytics';
import { addReport } from './reportHistory';
import { analyzeTextToxicity } from './perspectiveApi';
import { scanTextForDangerousUrls } from './webRisk';

/**
 * Bridge to iOS keyboard + notification extensions.
 *
 * Both extensions store alerts in the shared App Group (UserDefaults).
 * This bridge polls the native CustorianBridge module to read those alerts,
 * then processes them through the normal alert pipeline (parent sync, analytics, etc.).
 */

const POLL_INTERVAL = 3000;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const { CustorianBridge } = NativeModules;

/**
 * Start polling for alerts from keyboard + notification extensions.
 */
export function startKeyboardAlertPolling(
  onNewAlerts: (alerts: RiskAlert[]) => void
) {
  if (Platform.OS !== 'ios') return;

  console.log('[KeyboardBridge] Starting alert polling...');

  pollTimer = setInterval(async () => {
    try {
      if (!CustorianBridge) return;

      const raw = await CustorianBridge.getAllAlerts();
      if (!raw || raw === '[]') return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      console.log(`[KeyboardBridge] Found ${parsed.length} extension alerts`);

      // Convert to RiskAlert format
      const alerts: RiskAlert[] = parsed.map((item: any) => ({
        id: item.id || Date.now().toString(),
        category: (item.category || 'contentWellness') as ThreatCategory,
        score: item.score || 50,
        snippet: item.snippet || 'Threat detected',
        sourceApp: item.sourceApp || 'Unknown',
        timestamp: item.timestamp || new Date().toISOString(),
        reviewed: false,
        triggeredPatterns: item.patterns || [],
      }));

      // Enrich alerts with Perspective API + Web Risk (non-blocking)
      for (const alert of alerts) {
        // Run Perspective API on text snippets for toxicity scoring
        if (alert.snippet) {
          analyzeTextToxicity(alert.snippet).then(result => {
            if (result && result.riskScore > alert.score) {
              alert.score = Math.max(alert.score, result.riskScore);
              console.log(`[KeyboardBridge] Perspective enriched: ${alert.category} → score ${alert.score} (${result.dominantCategory})`);
            }
          }).catch(() => {});

          // Check URLs in the snippet for phishing/malware
          scanTextForDangerousUrls(alert.snippet).then(unsafeUrls => {
            if (unsafeUrls.length > 0) {
              alert.score = Math.max(alert.score, 90);
              console.log(`[KeyboardBridge] WebRisk: ${unsafeUrls.length} dangerous URL(s) found`);
            }
          }).catch(() => {});
        }
      }

      // Process each alert through the full pipeline
      for (const alert of alerts) {
        // Log to Supabase analytics
        logScanEvent({
          category: alert.category,
          severity: alert.score >= 80 ? 'critical' : alert.score >= 60 ? 'high' : alert.score >= 40 ? 'medium' : 'low',
          confidence: alert.score / 100,
          language: 'auto',
          source: alert.sourceApp === 'Keyboard' ? 'keyboard_extension' : 'notification_extension',
        }).catch(() => {});

        // Log to local report history
        addReport(alert, 'parent_notified').catch(() => {});

        // Sync to parent device
        syncAlertToFamily(alert).catch(() => {});

        // Log intervention
        if (alert.score >= 50) {
          logIntervention({ category: alert.category, intervention_type: 'empowerment_prompt' }).catch(() => {});
        }
      }

      // Send to main app
      onNewAlerts(alerts);

      // Clear processed alerts
      await CustorianBridge.clearAllAlerts();

    } catch (e) {
      // Silent fail — bridge might not be available in dev/Expo Go
    }
  }, POLL_INTERVAL);
}

/**
 * Stop polling.
 */
export function stopKeyboardAlertPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/**
 * Check if the native bridge is available.
 */
export function isBridgeAvailable(): boolean {
  return Platform.OS === 'ios' && !!CustorianBridge;
}
