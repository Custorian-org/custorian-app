/**
 * Daily Digest — morning summary for parents (Nooyi feedback)
 *
 * Generates a daily summary of yesterday's activity.
 * Displayed on the home screen and optionally as a notification.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RiskAlert } from './riskEngine';

export interface DailyDigest {
  date: string;
  totalThreats: number;
  categories: Record<string, number>;
  status: 'all_clear' | 'alerts_detected';
  message: string;
}

export async function generateDailyDigest(alerts: RiskAlert[]): Promise<DailyDigest> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toDateString();

  const yesterdayAlerts = alerts.filter(a => new Date(a.timestamp).toDateString() === yStr);

  const categories: Record<string, number> = {};
  yesterdayAlerts.forEach(a => {
    categories[a.category] = (categories[a.category] || 0) + 1;
  });

  const digest: DailyDigest = {
    date: yStr,
    totalThreats: yesterdayAlerts.length,
    categories,
    status: yesterdayAlerts.length === 0 ? 'all_clear' : 'alerts_detected',
    message: yesterdayAlerts.length === 0
      ? 'No threats detected yesterday. Protection is running.'
      : `${yesterdayAlerts.length} threat${yesterdayAlerts.length > 1 ? 's' : ''} detected yesterday. Review in dashboard.`,
  };

  await AsyncStorage.setItem('last_digest', JSON.stringify(digest));
  return digest;
}

export async function getLastDigest(): Promise<DailyDigest | null> {
  try {
    const raw = await AsyncStorage.getItem('last_digest');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
