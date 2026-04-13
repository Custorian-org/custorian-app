/**
 * Push Notifications for Critical Alerts (10Pearls feedback)
 *
 * Self-harm and violence alerts MUST push-notify the parent immediately.
 * The parent cannot rely on opening the app to see critical alerts.
 *
 * Architecture:
 * - Uses Expo Notifications (local notifications, no server needed)
 * - Critical alerts (self-harm score ≥80, violence score ≥80) trigger immediately
 * - High alerts notify within 5 minutes
 * - Medium/low alerts are available in-app only (no push)
 *
 * Privacy: Local notifications only. No notification content is sent to Apple/Google
 * push servers beyond the notification title. Message content stays on-device.
 */

import * as Notifications from 'expo-notifications';
import { RiskAlert, ThreatCategory } from './riskEngine';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

const CATEGORY_LABELS: Record<ThreatCategory, string> = {
  grooming: 'Grooming risk detected',
  bullying: 'Bullying detected',
  selfHarm: 'Self-harm signal detected',
  violence: 'Violence concern detected',
  contentWellness: 'Harmful content detected',
};

/**
 * Request notification permissions.
 * Call during onboarding.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Send a local push notification for a critical/high alert.
 * Only fires for score ≥ 60. Critical (≥80) gets immediate + sound.
 */
export async function notifyParentOfAlert(alert: RiskAlert): Promise<void> {
  // Only notify for high and critical alerts
  if (alert.score < 60) return;

  const isCritical = alert.score >= 80;
  const isSelfHarmOrViolence = alert.category === 'selfHarm' || alert.category === 'violence';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: isCritical ? '⚠ CRITICAL: ' + CATEGORY_LABELS[alert.category] : CATEGORY_LABELS[alert.category],
      body: isSelfHarmOrViolence && isCritical
        ? 'Immediate review recommended. Open Custorian now.'
        : 'Review this alert in the parent dashboard.',
      sound: isCritical,
      priority: isCritical
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.HIGH,
      badge: 1,
    },
    trigger: null, // Immediate
  });
}

/**
 * Clear notification badge when parent opens dashboard.
 */
export async function clearNotificationBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
