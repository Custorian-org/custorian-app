/**
 * Report History — CS-MR.2.4
 * Logs all threat actions with timestamp, category, confidence, and action taken.
 * Exportable for law enforcement if needed.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RiskAlert, ThreatCategory } from './riskEngine';

export interface ReportEntry {
  id: string;
  timestamp: string;
  category: ThreatCategory | string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  snippet: string;
  sourceApp: string;
  action: 'parent_notified' | 'blocked_contact' | 'reported_to_platform' | 'reported_to_le' | 'discussed_with_child' | 'no_action' | 'child_self_report' | 'csam_reported';
  actionTimestamp: string;
  parentNotes?: string;
  reportedTo?: string; // 'ncmec' | 'iwf' | 'platform_name' | 'local_police'
  status: 'open' | 'reviewed' | 'resolved' | 'escalated';
}

const STORAGE_KEY = 'custorian_report_history';

export async function addReport(alert: RiskAlert, action: ReportEntry['action'], parentNotes?: string, reportedTo?: string): Promise<ReportEntry> {
  const entry: ReportEntry = {
    id: alert.id,
    timestamp: alert.timestamp,
    category: alert.category,
    severity: alert.score >= 80 ? 'critical' : alert.score >= 60 ? 'high' : alert.score >= 40 ? 'medium' : 'low',
    confidence: alert.score / 100,
    snippet: alert.snippet,
    sourceApp: alert.sourceApp,
    action,
    actionTimestamp: new Date().toISOString(),
    parentNotes,
    reportedTo,
    status: action === 'csam_reported' || action === 'reported_to_le' ? 'escalated' : 'reviewed',
  };

  const history = await getHistory();
  history.unshift(entry);
  // Keep last 500 entries
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 500)));
  return entry;
}

export async function getHistory(): Promise<ReportEntry[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function updateStatus(id: string, status: ReportEntry['status']): Promise<void> {
  const history = await getHistory();
  const entry = history.find(e => e.id === id);
  if (entry) {
    entry.status = status;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
}

/**
 * Export report history for law enforcement.
 * Returns structured JSON suitable for formal reporting.
 */
export async function exportForLawEnforcement(): Promise<string> {
  const history = await getHistory();
  const report = {
    generated: new Date().toISOString(),
    generator: 'Custorian Child Safety App',
    standard: 'Custorian Controls Framework v0.1',
    control_reference: 'CS-MR.2.4',
    disclaimer: 'This report contains anonymised threat detection data. No message content is stored. Alert snippets are pattern-matched excerpts.',
    total_entries: history.length,
    escalated: history.filter(e => e.status === 'escalated').length,
    entries: history,
  };
  return JSON.stringify(report, null, 2);
}
