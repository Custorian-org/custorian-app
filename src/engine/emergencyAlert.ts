import { Alert, Linking, Platform } from 'react-native';
import { ThreatCategory, RiskAlert } from './riskEngine';

/**
 * Emergency alert system.
 * Triggers immediate parent notification + crisis resources for high-severity alerts.
 * In production: push notification to parent's phone.
 * MVP: on-device alert dialog + option to call emergency services.
 */

interface EmergencyConfig {
  threshold: number;
  callNumber: string;
  helpline: string;
  helplineNumber: string;
  message: string;
}

const EMERGENCY_CONFIGS: Partial<Record<ThreatCategory, EmergencyConfig>> = {
  selfHarm: {
    threshold: 80,
    callNumber: '112',
    helpline: 'Børnetelefonen',
    helplineNumber: '116111',
    message: 'A self-harm emergency has been detected. Your child may need immediate help.',
  },
  violence: {
    threshold: 80,
    callNumber: '112',
    helpline: 'Politi',
    helplineNumber: '114',
    message: 'A violence threat has been detected. This may require immediate attention.',
  },
};

export function checkEmergency(alert: RiskAlert): boolean {
  const config = EMERGENCY_CONFIGS[alert.category];
  if (!config) return false;
  return alert.score >= config.threshold;
}

export function triggerEmergencyAlert(alert: RiskAlert) {
  const config = EMERGENCY_CONFIGS[alert.category];
  if (!config) return;

  Alert.alert(
    '⚠️ Emergency Alert',
    config.message,
    [
      {
        text: `Call ${config.callNumber} (Emergency)`,
        style: 'destructive',
        onPress: () => Linking.openURL(`tel:${config.callNumber}`),
      },
      {
        text: `Call ${config.helpline} (${config.helplineNumber})`,
        onPress: () => Linking.openURL(`tel:${config.helplineNumber}`),
      },
      {
        text: 'Review in Dashboard',
        style: 'cancel',
      },
    ],
    { cancelable: false }
  );
}
