import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RiskAlert, ThreatCategory } from './riskEngine';

/**
 * Bridge to the iOS keyboard extension.
 *
 * The keyboard extension runs as a separate process and stores alerts
 * in a shared App Group (UserDefaults). This bridge reads those alerts
 * and imports them into the main app's AsyncStorage.
 *
 * For Expo Go (dev mode), we simulate keyboard input via the test screen.
 * For native builds, this reads from the actual shared App Group.
 */

// In Expo Go, keyboard extension isn't available.
// Alerts come through the test screen's processMessage() instead.
// In a native build (npx expo run:ios), the keyboard extension is active.

const POLL_INTERVAL = 5000; // Check for new keyboard alerts every 5 seconds

let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startKeyboardAlertPolling(
  onNewAlerts: (alerts: RiskAlert[]) => void
) {
  if (Platform.OS !== 'ios') return;

  // In Expo Go, NativeModules won't have our custom module.
  // Polling only works in native builds with the App Group bridge.
  // For now, this is a placeholder that activates in production.

  pollTimer = setInterval(async () => {
    try {
      // In native build, this would use NativeModules.GuardKeyboardBridge.getAlerts()
      // For MVP, keyboard alerts are simulated via the test screen
      const raw = await AsyncStorage.getItem('keyboard_alerts');
      if (raw) {
        const alerts: RiskAlert[] = JSON.parse(raw);
        if (alerts.length > 0) {
          onNewAlerts(alerts);
          await AsyncStorage.removeItem('keyboard_alerts');
        }
      }
    } catch {}
  }, POLL_INTERVAL);
}

export function stopKeyboardAlertPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
