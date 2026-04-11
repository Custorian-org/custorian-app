import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../src/constants/theme';

/**
 * School/Institutional Dashboard — B2B feature
 *
 * For school administrators and IT staff to:
 * - See aggregate threat data across all enrolled students (anonymized)
 * - Identify trending threats (e.g., bullying spike in Year 8)
 * - Get actionable recommendations
 * - Export compliance reports
 *
 * Privacy: No individual student data visible. Only aggregate patterns.
 * School sees: "3 grooming alerts this week across Year 7-8" not "Emma got groomed"
 */

interface SchoolMetric {
  category: string;
  icon: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface SchoolAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

// Mock data for demo — in production, aggregated from enrolled devices
const DEMO_METRICS: SchoolMetric[] = [
  { category: 'Grooming Attempts', icon: '🔍', count: 3, trend: 'down', color: Colors.danger },
  { category: 'Bullying Incidents', icon: '👊', count: 12, trend: 'up', color: Colors.warning },
  { category: 'Self-Harm Signals', icon: '💜', count: 2, trend: 'stable', color: '#8B5CF6' },
  { category: 'Violence Concerns', icon: '⚠️', count: 1, trend: 'down', color: Colors.deepOrange },
  { category: 'Content Alerts', icon: '💭', count: 8, trend: 'up', color: '#D946EF' },
  { category: 'Adult Content', icon: '🔞', count: 5, trend: 'stable', color: '#DC2626' },
];

const DEMO_ALERTS: SchoolAlert[] = [
  {
    id: '1',
    message: 'Bullying spike detected in Year 8 group — 7 incidents this week (3x average)',
    severity: 'critical',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    message: 'New harmful TikTok challenge trending among Year 6-7 students',
    severity: 'warning',
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    message: 'Overall threat levels down 15% from last month — safety talks may be working',
    severity: 'info',
    timestamp: '1 day ago',
  },
  {
    id: '4',
    message: 'Discord usage up 40% in Year 9 — consider reviewing server access policies',
    severity: 'warning',
    timestamp: '2 days ago',
  },
];

const DEMO_RECOMMENDATIONS = [
  {
    title: 'Address Year 8 bullying spike',
    action: 'Schedule class discussion on cyberbullying. Consider restorative justice session.',
    priority: 'high',
  },
  {
    title: 'TikTok challenge awareness',
    action: 'Send parent newsletter about current harmful challenges. Post in staff room.',
    priority: 'medium',
  },
  {
    title: 'Digital wellness week',
    action: 'Custodian data suggests screen time averaging 5.2hrs/day. Plan offline activity week.',
    priority: 'low',
  },
];

export default function SchoolDashboardScreen() {
  const [period, setPeriod] = useState<'week' | 'month' | 'term'>('week');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>School Safety Dashboard</Text>
      <Text style={styles.subtitle}>Odense International School — Demo</Text>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {(['week', 'month', 'term'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodChip, period === p && styles.periodChipActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && { color: Colors.white }]}>
              This {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metrics grid */}
      <View style={styles.metricsGrid}>
        {DEMO_METRICS.map((m) => (
          <View key={m.category} style={styles.metricCard}>
            <Text style={styles.metricIcon}>{m.icon}</Text>
            <Text style={[styles.metricCount, { color: m.color }]}>{m.count}</Text>
            <Text style={styles.metricLabel}>{m.category}</Text>
            <Text style={styles.metricTrend}>
              {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'}
              {' '}{m.trend}
            </Text>
          </View>
        ))}
      </View>

      {/* Alerts */}
      <Text style={styles.sectionTitle}>Alerts</Text>
      {DEMO_ALERTS.map((alert) => (
        <View
          key={alert.id}
          style={[
            styles.alertCard,
            alert.severity === 'critical' && { borderLeftColor: Colors.danger },
            alert.severity === 'warning' && { borderLeftColor: Colors.warning },
            alert.severity === 'info' && { borderLeftColor: Colors.safe },
          ]}
        >
          <Text style={styles.alertMessage}>{alert.message}</Text>
          <Text style={styles.alertTime}>{alert.timestamp}</Text>
        </View>
      ))}

      {/* Recommendations */}
      <Text style={styles.sectionTitle}>Recommended Actions</Text>
      {DEMO_RECOMMENDATIONS.map((rec, i) => (
        <View key={i} style={styles.recCard}>
          <View style={styles.recHeader}>
            <View style={[
              styles.priorityBadge,
              { backgroundColor: rec.priority === 'high' ? Colors.danger + '20' : rec.priority === 'medium' ? Colors.warning + '20' : Colors.safe + '20' },
            ]}>
              <Text style={[
                styles.priorityText,
                { color: rec.priority === 'high' ? Colors.danger : rec.priority === 'medium' ? Colors.warning : Colors.safe },
              ]}>
                {rec.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.recTitle}>{rec.title}</Text>
          </View>
          <Text style={styles.recAction}>{rec.action}</Text>
        </View>
      ))}

      {/* Export */}
      <TouchableOpacity style={styles.exportButton}>
        <Text style={styles.exportText}>📋 Export Compliance Report</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 4, marginBottom: 20 },
  periodRow: { flexDirection: 'row', marginBottom: 20 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: '#eee', marginRight: 8 },
  periodChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { fontSize: 13, fontWeight: '500', color: Colors.text },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  metricCard: { width: '48%', backgroundColor: Colors.white, borderRadius: 12, padding: 16, margin: '1%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  metricIcon: { fontSize: 24, marginBottom: 4 },
  metricCount: { fontSize: 28, fontWeight: 'bold' },
  metricLabel: { fontSize: 11, color: Colors.textLight, textAlign: 'center', marginTop: 4 },
  metricTrend: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 12, marginTop: 8 },
  alertCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#ddd' },
  alertMessage: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  alertTime: { fontSize: 11, color: Colors.textLight, marginTop: 6 },
  recCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 8 },
  recHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  priorityText: { fontSize: 10, fontWeight: 'bold' },
  recTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1 },
  recAction: { fontSize: 13, color: Colors.textLight, lineHeight: 18 },
  exportButton: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: Colors.primary },
  exportText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
});
