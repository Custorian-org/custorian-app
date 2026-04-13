import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors, Spacing, Radius, Shadow } from '../src/constants/theme';

const guards = [
  { label: 'Grooming', color: Colors.grooming },
  { label: 'Bullying', color: Colors.bullying },
  { label: 'Self-Harm', color: Colors.selfHarm },
  { label: 'Violence', color: Colors.violence },
  { label: 'Content', color: Colors.wellness },
  { label: 'Adult', color: Colors.danger },
  { label: 'Photos', color: Colors.primary },
];

const tools = [
  { label: 'Content\nRadar', route: '/content-radar', color: Colors.primary },
  { label: 'Parent\nGuide', route: '/parent-guide?category=grooming', color: Colors.safe },
  { label: 'School\nMode', route: '/school-dashboard', color: Colors.info },
  { label: 'Report\nSlang', route: '/submit-slang', color: Colors.warning },
];

export default function HomeScreen() {
  const { monitoringActive, toggleMonitoring, alerts, unreviewedCount } = useGuard();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }} bounces={false}>

        {/* Navy header — like Blueline's dark top section */}
        <View style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroBrand}>Custorian</Text>
                <Text style={styles.heroLabel}>CHILD DIGITAL SAFETY</Text>
              </View>
              <TouchableOpacity style={styles.alertBtn} onPress={() => router.push('/dashboard')}>
                <View style={styles.alertBtnInner}>
                  <Text style={styles.alertBtnIcon}>⬡</Text>
                </View>
                {unreviewedCount > 0 && (
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>{unreviewedCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Status */}
            <View style={styles.statusCard}>
              <View style={[styles.statusDot, { backgroundColor: monitoringActive ? Colors.safe : Colors.textMute }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>
                  {monitoringActive ? 'Protection Active' : 'Protection Paused'}
                </Text>
                <Text style={styles.statusSub}>
                  {monitoringActive ? '7 detection layers running' : 'Tap toggle to enable'}
                </Text>
              </View>
              <Switch
                value={monitoringActive}
                onValueChange={toggleMonitoring}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.safe + '60' }}
                thumbColor={monitoringActive ? Colors.safe : '#ccc'}
              />
            </View>
          </SafeAreaView>
        </View>

        {/* Content area — white background */}
        <View style={styles.content}>

          {/* Detection layers — horizontal scroll chips */}
          <Text style={styles.sectionLabel}>DETECTION LAYERS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.layerScroll} contentContainerStyle={styles.layerContent}>
            {guards.map((g, i) => (
              <View key={i} style={styles.layerChip}>
                <View style={[styles.layerDot, { backgroundColor: monitoringActive ? g.color : Colors.border }]} />
                <Text style={styles.layerText}>{g.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Tools grid — like Blueline's category icons */}
          <Text style={styles.sectionLabel}>TOOLS</Text>
          <View style={styles.toolsGrid}>
            {tools.map((t, i) => (
              <TouchableOpacity key={i} style={styles.toolCard} onPress={() => router.push(t.route as any)} activeOpacity={0.7}>
                <View style={[styles.toolDot, { backgroundColor: t.color + '15' }]}>
                  <View style={[styles.toolDotInner, { backgroundColor: t.color }]} />
                </View>
                <Text style={styles.toolLabel}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Alerts */}
          {alerts.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>ALERTS</Text>
              <TouchableOpacity style={styles.alertCard} onPress={() => router.push('/dashboard')} activeOpacity={0.7}>
                <View style={styles.alertCardLeft}>
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

          {/* Test — de-emphasized */}
          <TouchableOpacity style={styles.testBtn} onPress={() => router.push('/test')} activeOpacity={0.7}>
            <Text style={styles.testBtnText}>Test Detection Engine</Text>
          </TouchableOpacity>

          {/* Version */}
          <Text style={styles.version}>Custorian Standard v0.1 · Reference Implementation</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },

  // Hero — navy header like Blueline
  hero: {
    backgroundColor: Colors.navy,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingTop: Spacing.md, marginBottom: Spacing.lg,
  },
  heroBrand: { fontSize: 24, fontWeight: '800', color: Colors.textOnDark, letterSpacing: -0.5 },
  heroLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 3, marginTop: 4 },
  alertBtn: { position: 'relative' },
  alertBtnInner: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  alertBtnIcon: { fontSize: 18, color: 'rgba(255,255,255,0.6)' },
  alertBadge: {
    position: 'absolute', top: -2, right: -2, backgroundColor: Colors.danger,
    borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.navy,
  },
  alertBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  // Status card
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
  statusTitle: { fontSize: 16, fontWeight: '700', color: Colors.textOnDark },
  statusSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  // Content
  content: { padding: Spacing.lg, paddingTop: Spacing.xl },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.textMute,
    letterSpacing: 2.5, marginBottom: Spacing.sm, marginTop: Spacing.md,
  },

  // Detection layers — horizontal chips
  layerScroll: { marginBottom: Spacing.lg, marginHorizontal: -Spacing.lg },
  layerContent: { paddingHorizontal: Spacing.lg, gap: 8 },
  layerChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.sm,
  },
  layerDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  layerText: { fontSize: 13, fontWeight: '500', color: Colors.text },

  // Tools grid
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.lg },
  toolCard: {
    width: '47%', backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    ...Shadow.sm,
  },
  toolDot: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  toolDotInner: { width: 16, height: 16, borderRadius: 8 },
  toolLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'center', lineHeight: 18 },

  // Alert card
  alertCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.danger + '25', marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  alertCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  alertCount: { fontSize: 32, fontWeight: '800', color: Colors.danger },
  alertTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  alertSub: { fontSize: 12, color: Colors.danger, marginTop: 2 },
  chevron: { fontSize: 28, color: Colors.textMute, fontWeight: '300' },

  // Test
  testBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.md,
  },
  testBtnText: { fontSize: 13, fontWeight: '500', color: Colors.textMute },

  // Version
  version: { fontSize: 9, color: Colors.textMute, textAlign: 'center', letterSpacing: 1, opacity: 0.6 },
});
