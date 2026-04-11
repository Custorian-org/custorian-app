/**
 * Screen Time Tracker — monitors app usage patterns and correlates
 * with mood/behavior. Detects concerning usage patterns like excessive
 * screen time, late-night use, and usage spikes.
 *
 * Uses expo-background-fetch to periodically check foreground app.
 * Stores daily usage in AsyncStorage.
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── INTERFACES ──────────────────────────────────────────────

export interface AppUsageRecord {
  app: string;
  dailyMinutes: number;
  lastSeen: string; // ISO timestamp
}

export interface DailyUsageSummary {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  apps: AppUsageRecord[];
  lateNightMinutes: number; // minutes used between 10pm-6am
}

export interface UsageAlert {
  app: string;
  dailyMinutes: number;
  pattern: 'excessive_total' | 'app_spike' | 'late_night' | 'flagged_app_overuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export type AgeGroup = '8-12' | '13-17';

// ── CONSTANTS ───────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'custodian_usage_';
const BACKGROUND_TASK_NAME = 'custodian-screen-time-check';
const CHECK_INTERVAL_MINUTES = 15;

/** Age-appropriate daily screen time limits in minutes */
const DAILY_LIMITS: Record<AgeGroup, number> = {
  '8-12': 240,  // 4 hours
  '13-17': 360, // 6 hours
};

/** Apps that warrant extra scrutiny for younger children */
const FLAGGED_APPS_YOUNG: string[] = [
  'discord',
  'tiktok',
  'snapchat',
  'omegle',
  'whisper',
  'yolo',
  'kik',
  'telegram',
];

/** Threshold (minutes) on flagged apps before alerting for 8-12 age group */
const FLAGGED_APP_LIMIT_YOUNG = 30;

/** Threshold (minutes) on flagged apps before alerting for 13-17 age group */
const FLAGGED_APP_LIMIT_TEEN = 90;

/** Late night cutoff hours by age group */
const LATE_NIGHT_START: Record<AgeGroup, number> = {
  '8-12': 22,  // 10pm
  '13-17': 23, // 11pm
};

const LATE_NIGHT_END = 6; // 6am for both groups

/** Spike detection: alert if usage is this multiple of the 7-day average */
const SPIKE_MULTIPLIER = 3;

// ── STORAGE HELPERS ─────────────────────────────────────────

function getStorageKey(date: string): string {
  return `${STORAGE_KEY_PREFIX}${date}`;
}

function getTodayKey(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  return getStorageKey(dateStr);
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

async function loadDailyUsage(date: string): Promise<DailyUsageSummary> {
  const key = getStorageKey(date);
  const raw = await AsyncStorage.getItem(key);
  if (raw) {
    return JSON.parse(raw) as DailyUsageSummary;
  }
  return {
    date,
    totalMinutes: 0,
    apps: [],
    lateNightMinutes: 0,
  };
}

async function saveDailyUsage(summary: DailyUsageSummary): Promise<void> {
  const key = getStorageKey(summary.date);
  await AsyncStorage.setItem(key, JSON.stringify(summary));
}

// ── USAGE RECORDING ─────────────────────────────────────────

/**
 * Record that an app was in the foreground for a given duration.
 * Called by the background task or manually by the monitoring system.
 */
export async function recordAppUsage(
  appName: string,
  durationMinutes: number
): Promise<void> {
  const today = getTodayDate();
  const summary = await loadDailyUsage(today);

  const existing = summary.apps.find(
    (a) => a.app.toLowerCase() === appName.toLowerCase()
  );

  if (existing) {
    existing.dailyMinutes += durationMinutes;
    existing.lastSeen = new Date().toISOString();
  } else {
    summary.apps.push({
      app: appName,
      dailyMinutes: durationMinutes,
      lastSeen: new Date().toISOString(),
    });
  }

  summary.totalMinutes += durationMinutes;

  // Track late-night usage
  const hour = new Date().getHours();
  if (hour >= 22 || hour < LATE_NIGHT_END) {
    summary.lateNightMinutes += durationMinutes;
  }

  await saveDailyUsage(summary);
}

// ── BACKGROUND TASK ─────────────────────────────────────────

TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    // In a real implementation, this would use a native module to detect
    // the foreground app. Since React Native / Expo doesn't expose this
    // directly, this task records a "check-in" and the native bridge
    // (to be implemented per-platform) would supply the actual app name.
    //
    // For now, this serves as the scheduling backbone — the native module
    // calls recordAppUsage() with the detected foreground app.

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (_error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background fetch task for periodic screen time checks.
 * Call this once during app initialization.
 */
export async function registerScreenTimeTracking(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_TASK_NAME
  );

  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: CHECK_INTERVAL_MINUTES * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}

/**
 * Unregister the background fetch task.
 */
export async function unregisterScreenTimeTracking(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    BACKGROUND_TASK_NAME
  );

  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
  }
}

// ── ANALYSIS ────────────────────────────────────────────────

/**
 * Load the past N days of usage data for averaging/comparison.
 */
async function getHistoricalUsage(days: number): Promise<DailyUsageSummary[]> {
  const summaries: DailyUsageSummary[] = [];
  const now = new Date();

  for (let i = 1; i <= days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const summary = await loadDailyUsage(dateStr);
    if (summary.totalMinutes > 0) {
      summaries.push(summary);
    }
  }

  return summaries;
}

/**
 * Calculate the 7-day average daily minutes for a specific app.
 */
async function getAppAverage(appName: string): Promise<number> {
  const history = await getHistoricalUsage(7);
  if (history.length === 0) return 0;

  const total = history.reduce((sum, day) => {
    const appRecord = day.apps.find(
      (a) => a.app.toLowerCase() === appName.toLowerCase()
    );
    return sum + (appRecord ? appRecord.dailyMinutes : 0);
  }, 0);

  return total / history.length;
}

// ── PUBLIC API ──────────────────────────────────────────────

/**
 * Get today's usage summary.
 */
export async function getUsageSummary(): Promise<DailyUsageSummary> {
  const today = getTodayDate();
  return loadDailyUsage(today);
}

/**
 * Analyze today's usage and return any alerts based on the child's age group.
 */
export async function getUsageAlerts(
  ageGroup: AgeGroup
): Promise<UsageAlert[]> {
  const alerts: UsageAlert[] = [];
  const today = await getUsageSummary();
  const dailyLimit = DAILY_LIMITS[ageGroup];
  const lateNightStart = LATE_NIGHT_START[ageGroup];
  const flaggedLimit =
    ageGroup === '8-12' ? FLAGGED_APP_LIMIT_YOUNG : FLAGGED_APP_LIMIT_TEEN;

  // ── Check 1: Total screen time exceeding age-appropriate limit ──
  if (today.totalMinutes > dailyLimit) {
    const overageMinutes = today.totalMinutes - dailyLimit;
    const severity =
      overageMinutes > 120
        ? 'critical'
        : overageMinutes > 60
          ? 'high'
          : 'medium';

    alerts.push({
      app: 'ALL',
      dailyMinutes: today.totalMinutes,
      pattern: 'excessive_total',
      severity,
      recommendation:
        `Total screen time today is ${today.totalMinutes} minutes — ` +
        `${overageMinutes} minutes over the recommended ${dailyLimit}-minute limit ` +
        `for ages ${ageGroup}. Consider setting a device wind-down schedule. ` +
        `Research links excessive screen time to sleep disruption and reduced physical activity.`,
    });
  }

  // ── Check 2: Usage spikes on individual apps ──
  for (const appRecord of today.apps) {
    const avg = await getAppAverage(appRecord.app);
    if (avg > 0 && appRecord.dailyMinutes >= avg * SPIKE_MULTIPLIER) {
      alerts.push({
        app: appRecord.app,
        dailyMinutes: appRecord.dailyMinutes,
        pattern: 'app_spike',
        severity: appRecord.dailyMinutes > 180 ? 'high' : 'medium',
        recommendation:
          `${appRecord.app} usage today (${appRecord.dailyMinutes} min) is ` +
          `${Math.round(appRecord.dailyMinutes / avg)}x the 7-day average ` +
          `(${Math.round(avg)} min/day). A sudden spike can indicate obsessive use, ` +
          `social conflict, or exposure to compelling/harmful content. ` +
          `Check in with your child about what they are doing on the app.`,
      });
    }
  }

  // ── Check 3: Late night usage ──
  if (today.lateNightMinutes > 0) {
    const severity = today.lateNightMinutes > 60 ? 'high' : 'medium';

    alerts.push({
      app: 'ALL',
      dailyMinutes: today.lateNightMinutes,
      pattern: 'late_night',
      severity,
      recommendation:
        `${today.lateNightMinutes} minutes of screen time detected after ` +
        `${lateNightStart}:00. Late-night device use disrupts melatonin ` +
        `production and sleep quality. Children are also more vulnerable to ` +
        `risky interactions when tired and unsupervised. Consider enabling ` +
        `device downtime or collecting devices before bedtime.`,
    });
  }

  // ── Check 4: High time on flagged apps ──
  for (const appRecord of today.apps) {
    const appLower = appRecord.app.toLowerCase();
    const isFlagged = FLAGGED_APPS_YOUNG.some(
      (f) => appLower.includes(f) || f.includes(appLower)
    );

    if (isFlagged && appRecord.dailyMinutes > flaggedLimit) {
      alerts.push({
        app: appRecord.app,
        dailyMinutes: appRecord.dailyMinutes,
        pattern: 'flagged_app_overuse',
        severity: ageGroup === '8-12' ? 'critical' : 'high',
        recommendation:
          `${appRecord.app} has higher predator/content risk and your child ` +
          `has spent ${appRecord.dailyMinutes} minutes on it today ` +
          `(limit: ${flaggedLimit} min for ages ${ageGroup}). ` +
          (ageGroup === '8-12'
            ? `This app is not recommended for children under 13. ` +
              `Review their activity and consider removing access.`
            : `Review their contacts and activity on this platform. ` +
              `Ensure privacy settings are properly configured.`),
      });
    }
  }

  // Sort by severity (critical first)
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  alerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return alerts;
}

/**
 * Clear all stored usage data. Useful for testing or user-initiated reset.
 */
export async function clearUsageData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const usageKeys = keys.filter((k) => k.startsWith(STORAGE_KEY_PREFIX));
  if (usageKeys.length > 0) {
    await AsyncStorage.multiRemove(usageKeys);
  }
}
