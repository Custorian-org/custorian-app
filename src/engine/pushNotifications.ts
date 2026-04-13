/**
 * Push Notifications for Critical Alerts
 *
 * Self-harm and violence alerts push-notify the parent immediately.
 * Uses Expo local notifications — no server needed.
 */

import * as Notifications from 'expo-notifications';
import { RiskAlert, ThreatCategory } from './riskEngine';

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

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function notifyParentOfAlert(alert: RiskAlert): Promise<void> {
  if (alert.score < 60) return;

  const isCritical = alert.score >= 80;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: isCritical ? '⚠ CRITICAL: ' + CATEGORY_LABELS[alert.category] : CATEGORY_LABELS[alert.category],
      body: isCritical
        ? 'Immediate review recommended. Open Custorian now.'
        : 'Review this alert in the parent dashboard.',
      sound: isCritical,
      badge: 1,
    },
    trigger: null,
  });
}

export async function clearNotificationBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
