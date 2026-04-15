/**
 * Parent Report Summary / Digest — CS-PR.1.3
 * Weekly/daily digest of all alerts, actions taken, and trends.
 * Generates a structured summary for push notification or in-app view.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RiskAlert, ThreatCategory } from './riskEngine';

export interface DigestPeriod {
  start: string; // ISO8601
  end: string;
  totalAlerts: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  topSourceApps: string[];
  unreviewed: number;
  selfReports: number;
  interventionsShown: number;
  trend: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
  highlights: string[];
}

const ALERTS_KEY = 'custorian_alerts';

export async function generateDigest(periodDays: number = 7): Promise<DigestPeriod> {
  const alerts = await getStoredAlerts();
  const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
  const periodAlerts = alerts.filter(a => a.timestamp >= cutoff);
  const priorAlerts = alerts.filter(a => a.timestamp < cutoff && a.timestamp >= new Date(Date.now() - periodDays * 2 * 24 * 60 * 60 * 1000).toISOString());

  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const sourceApps: Record<string, number> = {};
  let selfReports = 0;
  let unreviewed = 0;

  periodAlerts.forEach(a => {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    const sev = a.score >= 80 ? 'critical' : a.score >= 60 ? 'high' : a.score >= 40 ? 'medium' : 'low';
    bySeverity[sev]++;
    sourceApps[a.sourceApp] = (sourceApps[a.sourceApp] || 0) + 1;
    if (a.sourceApp === 'Self-Report') selfReports++;
    if (!a.reviewed) unreviewed++;
  });

  const topSourceApps = Object.entries(sourceApps)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([app]) => app);

  // Trend: compare this period to prior period
  let trend: DigestPeriod['trend'] = 'insufficient_data';
  if (periodAlerts.length >= 5 && priorAlerts.length >= 5) {
    const ratio = periodAlerts.length / priorAlerts.length;
    trend = ratio > 1.2 ? 'worsening' : ratio < 0.8 ? 'improving' : 'stable';
  }

  // Generate human-readable highlights
  const highlights: string[] = [];
  if (periodAlerts.length === 0) highlights.push('No threats detected this period. All clear.');
  if (bySeverity.critical > 0) highlights.push(`${bySeverity.critical} critical alert(s) — review immediately.`);
  if (selfReports > 0) highlights.push(`Your child self-reported ${selfReports} time(s). They're reaching out — talk to them.`);
  if (unreviewed > 0) highlights.push(`${unreviewed} alert(s) still unreviewed.`);
  const topCat = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0];
  if (topCat) highlights.push(`Most common: ${topCat[0]} (${topCat[1]} instances).`);
  if (trend === 'improving') highlights.push('Overall trend is improving vs. last period.');
  if (trend === 'worsening') highlights.push('Alert volume increased vs. last period — monitor closely.');

  return {
    start: cutoff,
    end: new Date().toISOString(),
    totalAlerts: periodAlerts.length,
    byCategory,
    bySeverity,
    topSourceApps,
    unreviewed,
    selfReports,
    interventionsShown: periodAlerts.filter(a => a.score >= 50).length,
    trend,
    highlights,
  };
}

async function getStoredAlerts(): Promise<RiskAlert[]> {
  try {
    const data = await AsyncStorage.getItem(ALERTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Format digest as a notification-friendly string.
 */
export function formatDigestNotification(digest: DigestPeriod): { title: string; body: string } {
  if (digest.totalAlerts === 0) {
    return {
      title: 'Custorian Weekly Summary',
      body: 'No threats detected this week. Everything looks safe.',
    };
  }

  const criticalNote = digest.bySeverity.critical > 0 ? ` (${digest.bySeverity.critical} critical!)` : '';
  return {
    title: `Custorian: ${digest.totalAlerts} alerts this week${criticalNote}`,
    body: digest.highlights.slice(0, 2).join(' '),
  };
}
