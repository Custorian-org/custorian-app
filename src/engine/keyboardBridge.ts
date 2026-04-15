import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RiskAlert, ThreatCategory } from './riskEngine';

/**
 * Bridge to the iOS keyboard extension.
 *
 * The keyboard extension runs as a separate process and stores alerts
 * in a shared App Group (UserDefaults suite: group.com.custorian.app).
 *
 * This bridge polls the shared storage and imports alerts into the main app.
 * In builds without the native keyboard extension, it falls back to AsyncStorage.
 */

const POLL_INTERVAL = 3000; // Check every 3 seconds
const APP_GROUP = 'group.com.custorian.app';
const ALERTS_KEY = 'custorian_keyboard_alerts';

let pollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Read alerts from the shared App Group (native) or AsyncStorage (fallback).
 */
async function readSharedAlerts(): Promise<RiskAlert[]> {
  try {
    // Try native App Group access first (only works in native builds)
    if (Platform.OS === 'ios' && NativeModules.CustorianBridge) {
      const raw = await NativeModules.CustorianBridge.getSharedData(ALERTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    }
  } catch {}

  // Fallback: read from AsyncStorage (for dev/Expo Go)
  try {
    const raw = await AsyncStorage.getItem('keyboard_alerts');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  return [];
}

/**
 * Clear alerts from shared storage after reading.
 */
async function clearSharedAlerts(): Promise<void> {
  try {
    if (Platform.OS === 'ios' && NativeModules.CustorianBridge) {
      await NativeModules.CustorianBridge.clearSharedData(ALERTS_KEY);
    }
  } catch {}
  try {
    await AsyncStorage.removeItem('keyboard_alerts');
  } catch {}
}

/**
 * Start polling for keyboard extension alerts.
 */
export function startKeyboardAlertPolling(
  onNewAlerts: (alerts: RiskAlert[]) => void
) {
  if (Platform.OS !== 'ios') return;

  console.log('[KeyboardBridge] Starting alert polling...');

  pollTimer = setInterval(async () => {
    try {
      const alerts = await readSharedAlerts();
      if (alerts.length > 0) {
        console.log(`[KeyboardBridge] Found ${alerts.length} keyboard alerts`);
        onNewAlerts(alerts);
        await clearSharedAlerts();
      }
    } catch (e) {
      console.error('[KeyboardBridge] Poll error:', e);
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
    console.log('[KeyboardBridge] Stopped polling.');
  }
}

/**
 * Check if the keyboard extension appears to be installed and active.
 */
export async function isKeyboardExtensionActive(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  try {
    if (NativeModules.CustorianBridge) {
      const status = await NativeModules.CustorianBridge.isKeyboardEnabled();
      return !!status;
    }
  } catch {}

  return false;
}
