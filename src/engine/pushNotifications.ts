/**
 * Push Notifications for Critical Alerts
 *
 * Currently uses local alerts (Alert.alert) as a fallback
 * until Push Notifications capability is enabled in the
 * Apple Developer provisioning profile.
 *
 * To enable full push notifications:
 * 1. Apple Developer Portal → Identifiers → com.custorian.app → Enable Push Notifications
 * 2. Regenerate provisioning profile
 * 3. Add "expo-notifications" back to app.json plugins
 */

import { Alert } from 'react-native';
import { RiskAlert, ThreatCategory } from './riskEngine';

const CATEGORY_LABELS: Record<ThreatCategory, string> = {
  grooming: 'Grooming risk detected',
  bullying: 'Bullying detected',
  selfHarm: 'Self-harm signal detected',
  violence: 'Violence concern detected',
  contentWellness: 'Harmful content detected',
};

export async function requestNotificationPermissions(): Promise<boolean> {
  // Placeholder — returns true. Full implementation when push is enabled.
  return true;
}

export async function notifyParentOfAlert(alert: RiskAlert): Promise<void> {
  // Only notify for high and critical alerts
  if (alert.score < 60) return;

  const isCritical = alert.score >= 80;

  // Fallback: use in-app alert until push notifications are configured
  if (isCritical) {
    Alert.alert(
      '⚠ ' + CATEGORY_LABELS[alert.category],
      'Immediate review recommended. Open the parent dashboard.',
      [{ text: 'Review Now', style: 'default' }]
    );
  }
}

export async function clearNotificationBadge(): Promise<void> {
  // No-op until push configured
}
