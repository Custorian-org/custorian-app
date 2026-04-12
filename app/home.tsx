import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors, Spacing, Radius } from '../src/constants/theme';

const guards = [
  { icon: '🔍', label: 'Grooming Detection', color: Colors.grooming },
  { icon: '👊', label: 'Bullying Detection', color: Colors.bullying },
  { icon: '💜', label: 'Self-Harm Signals', color: Colors.selfHarm },
  { icon: '⚠️', label: 'Violence Detection', color: Colors.violence },
  { icon: '💭', label: 'Content Wellness', color: Colors.wellness },
  { icon: '🔞', label: 'Adult Content Blocker', color: Colors.danger },
  { icon: '📷', label: 'Photo Monitoring', color: Colors.info },
];

export default function HomeScreen() {
  const { monitoringActive, toggleMonitoring, alerts, unreviewedCount } = useGuard();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Custorian</Text>
            <Text style={styles.subtitle}>Protecting the innocent</Text>
          </View>
          <TouchableOpacity style={styles.dashButton} onPress={() => router.push('/dashboard')}>
            <Text style={styles.dashIcon}>📊</Text>
            {unreviewedCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreviewedCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Status card */}
        <View style={[styles.statusCard, monitoringActive && styles.statusCardActive]}>
          <View style={[styles.statusDot, { backgroundColor: monitoringActive ? Colors.safe : Colors.textMute }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              {monitoringActive ? 'Protection Active' : 'Protection Paused'}
            </Text>
            <Text style={styles.statusSub}>
              {monitoringActive ? 'All detection layers running' : 'Tap the toggle to start monitoring'}
            </Text>
          </View>
          <Switch
            value={monitoringActive}
            onValueChange={toggleMonitoring}
            trackColor={{ false: Colors.border, true: Colors.accent + '40' }}
            thumbColor={monitoringActive ? Colors.accent : Colors.textMute}
          />
        </View>

        {/* Detection layers */}
        <Text style={styles.sectionLabel}>DETECTION LAYERS</Text>
        <View style={styles.layersCard}>
          {guards.map((g, i) => (
            <View key={i}>
              <View style={styles.layerRow}>
                <Text style={styles.layerIcon}>{g.icon}</Text>
                <Text style={styles.layerLabel}>{g.label}</Text>
                <View style={[styles.layerDot, { backgroundColor: monitoringActive ? g.color : Colors.border }]} />
              </View>
              {i < guards.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>TOOLS</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/content-radar')}>
            <Text style={styles.actionIcon}>📡</Text>
            <Text style={styles.actionTitle}>Content Radar</Text>
            <Text style={styles.actionSub}>Rate games, shows, YouTube</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/parent-guide?category=grooming')}>
            <Text style={styles.actionIcon}>📖</Text>
            <Text style={styles.actionTitle}>Parent Guide</Text>
            <Text style={styles.actionSub}>How to talk about threats</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/school-dashboard')}>
            <Text style={styles.actionIcon}>🏫</Text>
            <Text style={styles.actionTitle}>School Dashboard</Text>
            <Text style={styles.actionSub}>Aggregate metrics</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/submit-slang')}>
            <Text style={styles.actionIcon}>🗣️</Text>
            <Text style={styles.actionTitle}>Report Slang</Text>
            <Text style={styles.actionSub}>Help improve detection</Text>
          </TouchableOpacity>
        </View>

        {/* Alerts summary */}
        {alerts.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>RECENT ALERTS</Text>
            <TouchableOpacity style={styles.alertCard} onPress={() => router.push('/dashboard')}>
              <View style={styles.alertContent}>
                <Text style={styles.alertCount}>{alerts.length}</Text>
                <View>
                  <Text style={styles.alertTitle}>Alert{alerts.length > 1 ? 's' : ''} logged</Text>
                  <Text style={styles.alertSub}>{unreviewedCount} unreviewed</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Test */}
        <TouchableOpacity style={styles.testButton} onPress={() => router.push('/test')}>
          <Text style={styles.testButtonText}>🧪 Test Detection</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, padding: Spacing.lg },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  brand: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -1 },
  subtitle: { fontSize: 12, color: Colors.textMute, marginTop: 2, letterSpacing: 1 },
  dashButton: { position: 'relative', padding: Spacing.sm },
  dashIcon: { fontSize: 22 },
  badge: { position: 'absolute', top: 2, right: 2, backgroundColor: Colors.danger, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: Colors.text, fontSize: 10, fontWeight: 'bold' },

  // Status
  statusCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  statusCardActive: { borderColor: Colors.safe + '30', backgroundColor: Colors.safe + '08' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
  statusTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  statusSub: { fontSize: 12, color: Colors.textDim, marginTop: 2 },

  // Section label
  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMute, letterSpacing: 2.5, marginBottom: Spacing.sm },

  // Detection layers
  layersCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.xl,
  },
  layerRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, paddingVertical: 14 },
  layerIcon: { fontSize: 18, marginRight: Spacing.md, width: 28 },
  layerLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text },
  layerDot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },

  // Actions grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  actionCard: {
    width: '48.5%', backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  actionIcon: { fontSize: 24, marginBottom: Spacing.sm },
  actionTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  actionSub: { fontSize: 11, color: Colors.textMute },

  // Alerts
  alertCard: {
    backgroundColor: Colors.danger + '10', borderRadius: Radius.lg, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.danger + '25', marginBottom: Spacing.xl,
  },
  alertContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  alertCount: { fontSize: 28, fontWeight: '800', color: Colors.danger },
  alertTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  alertSub: { fontSize: 12, color: Colors.danger },
  chevron: { fontSize: 24, color: Colors.textMute },

  // Test
  testButton: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center',
  },
  testButtonText: { fontSize: 14, fontWeight: '600', color: Colors.textDim },
});
