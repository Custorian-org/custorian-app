/**
 * Privacy-respecting local analytics (Chamath feedback).
 *
 * Tracks key events ON-DEVICE only. No data sent anywhere.
 * Used to understand onboarding drop-off and feature usage.
 * Data viewable in Settings → About (for the developer).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_KEY = 'custorian_analytics';

export interface AnalyticsData {
  onboarding_started?: string;
  onboarding_step2?: string;
  onboarding_step3?: string;
  pin_set?: string;
  keyboard_enabled?: string;
  first_alert?: string;
  first_demo?: string;
  first_content_radar?: string;
  first_faq_opened?: string;
  first_share?: string;
  total_alerts: number;
  total_sessions: number;
  last_session?: string;
}

let cache: AnalyticsData | null = null;

async function load(): Promise<AnalyticsData> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_KEY);
    cache = raw ? JSON.parse(raw) : { total_alerts: 0, total_sessions: 0 };
  } catch {
    cache = { total_alerts: 0, total_sessions: 0 };
  }
  return cache!;
}

async function save() {
  if (cache) await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(cache));
}

export async function trackEvent(event: keyof AnalyticsData) {
  const data = await load();
  if (event === 'total_alerts') {
    data.total_alerts = (data.total_alerts || 0) + 1;
  } else if (event === 'total_sessions') {
    data.total_sessions = (data.total_sessions || 0) + 1;
    data.last_session = new Date().toISOString();
  } else if (!data[event]) {
    // Only record first occurrence
    (data as any)[event] = new Date().toISOString();
  }
  await save();
}

export async function getAnalytics(): Promise<AnalyticsData> {
  return load();
}

export async function resetAnalytics() {
  cache = { total_alerts: 0, total_sessions: 0 };
  await save();
}
