/**
 * Protection Badge — persistent notification showing Custorian is active.
 *
 * Shows "🛡️ Custorian is protecting you" as a pinned notification
 * on the child's device when monitoring is enabled.
 *
 * Uses the purple sphere icon (custorian-shield).
 * The notification persists until monitoring is disabled.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getFamilyConfig } from './familySync';

const BADGE_ID = 'custorian-protection-badge';

/**
 * Show the protection badge notification on child devices.
 */
export async function showProtectionBadge(): Promise<void> {
  const config = await getFamilyConfig();
  // Only show on child devices
  if (config?.role !== 'child') return;

  if (Platform.OS !== 'ios') return;

  // Request permission if not granted
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') return;
  }

  // Cancel any existing badge notification
  await Notifications.dismissNotificationAsync(BADGE_ID).catch(() => {});

  // Schedule a persistent local notification
  await Notifications.scheduleNotificationAsync({
    identifier: BADGE_ID,
    content: {
      title: 'Custorian is protecting you',
      body: 'Your online safety is active. If something feels wrong, open the app and tap "I need help".',
      sound: undefined, // Silent
      sticky: true, // Persistent — can't be swiped away on Android
      priority: Notifications.AndroidNotificationPriority.LOW,
      badge: 0,
    },
    trigger: null, // Show immediately
  });

  console.log('[ProtectionBadge] Persistent notification shown');
}

/**
 * Hide the protection badge (when monitoring is disabled by parent).
 */
export async function hideProtectionBadge(): Promise<void> {
  await Notifications.dismissNotificationAsync(BADGE_ID).catch(() => {});
  console.log('[ProtectionBadge] Notification dismissed');
}
