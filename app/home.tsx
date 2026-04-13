import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors, Spacing, Radius, Shadow } from '../src/constants/theme';

const guards = [
  { label: 'Grooming', color: Colors.grooming },
  { label: 'Bullying', color: Colors.bullying },
  { label: 'Self-Harm', color: Colors.selfHarm },
  { label: 'Violence', color: Colors.violence },
  { label: 'Harmful Trends', color: Colors.wellness },
  { label: 'Adult Content', color: Colors.danger },
  { label: 'Photo Safety', color: Colors.primary },
];

export default function HomeScreen() {
  const { monitoringActive, toggleMonitoring, alerts, unreviewedCount } = useGuard();
  const router = useRouter();
  const [lastScan, setLastScan] = useState('just now');

  // Simulate last scan time
  useEffect(() => {
    const interval = setInterval(() => {
      if (monitoringActive) setLastScan(`${Math.floor(Math.random() * 3) + 1} min ago`);
    }, 60000);
    return () => clearInterval(interval);
  }, [monitoringActive]);

  const todayAlerts = alerts.filter(a => {
    const d = new Date(a.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const inviteFamily = async () => {
    await Share.share({
      message: 'I use Custorian to protect my kids online. Free, on-device, open source. Check it out: custorian.org',
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── NAVY HERO ── */}
        <View style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroTop}>
              <Text style={styles.heroBrand}>Custorian</Text>
              <TouchableOpacity style={styles.menuBtn} onPress={() => router.push('/dashboard')}>
                <View style={styles.menuBtnInner}>
                  <View style={styles.hexDot} />
                </View>
                {unreviewedCount > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeText}>{unreviewedCount}</Text></View>
                )}
              </TouchableOpacity>
            </View>

            {/* Big status — the ONE thing parents see */}
            <View style={[styles.statusBlock, monitoringActive ? styles.statusSafe : styles.statusOff]}>
              <View style={[styles.statusOrb, { backgroundColor: monitoringActive ? Colors.safe : 'rgba(255,255,255,0.15)' }]}>
                <View style={[styles.statusOrbInner, { backgroundColor: monitoringActive ? '#fff' : 'rgba(255,255,255,0.3)' }]} />
              </View>
              <Text style={styles.statusHeadline}>
                {monitoringActive ? 'Your child is protected' : 'Protection is off'}
              </Text>
              <Text style={styles.statusDetail}>
                {monitoringActive
                  ? `${todayAlerts.length} threat${todayAlerts.length !== 1 ? 's' : ''} detected today · Last scan: ${lastScan}`
                  : 'Enable monitoring to start protecting'}
              </Text>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{monitoringActive ? 'Active' : 'Paused'}</Text>
                <Switch
                  value={monitoringActive}
                  onValueChange={toggleMonitoring}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: Colors.safe + '50' }}
                  thumbColor={monitoringActive ? Colors.safe : '#888'}
                />
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* ── WHITE CONTENT AREA ── */}
        <View style={styles.content}>

          {/* Detection layers — horizontal chips */}
          <Text style={styles.sectionLabel}>DETECTION LAYERS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 8 }}>
            {guards.map((g, i) => (
              <View key={i} style={styles.chip}>
                <View style={[styles.chipDot, { backgroundColor: monitoringActive ? g.color : Colors.border }]} />
                <Text style={styles.chipText}>{g.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Primary actions — only Content Radar and Parent Guide */}
          <Text style={styles.sectionLabel}>TOOLS</Text>
          <TouchableOpacity style={styles.primaryCard} onPress={() => router.push('/content-radar')} activeOpacity={0.7}>
            <View style={[styles.primaryDot, { backgroundColor: Colors.primary + '12' }]}>
              <View style={[styles.primaryDotInner, { backgroundColor: Colors.primary }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryTitle}>Content Radar</Text>
              <Text style={styles.primarySub}>Check if a game, show, or creator is safe for your child's age</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryCard} onPress={() => router.push('/parent-guide?category=grooming')} activeOpacity={0.7}>
            <View style={[styles.primaryDot, { backgroundColor: Colors.safe + '12' }]}>
              <View style={[styles.primaryDotInner, { backgroundColor: Colors.safe }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryTitle}>Parent Guide</Text>
              <Text style={styles.primarySub}>How to talk to your child about digital threats — conversation starters included</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Alerts */}
          {alerts.length > 0 && (
            <TouchableOpacity style={styles.alertCard} onPress={() => router.push('/dashboard')} activeOpacity={0.7}>
              <Text style={styles.alertNum}>{alerts.length}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Alert{alerts.length !== 1 ? 's' : ''} logged</Text>
                {unreviewedCount > 0 && <Text style={styles.alertUrgent}>{unreviewedCount} need review</Text>}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}

          {/* Invite — distribution hook (Hoffman) */}
          <TouchableOpacity style={styles.inviteCard} onPress={inviteFamily} activeOpacity={0.7}>
            <Text style={styles.inviteTitle}>Invite a family</Text>
            <Text style={styles.inviteSub}>Share Custorian with another parent</Text>
          </TouchableOpacity>

          {/* Secondary actions — collapsed */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/submit-slang')}>
              <Text style={styles.secondaryText}>Report Slang</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/test')}>
              <Text style={styles.secondaryText}>Test Engine</Text>
            </TouchableOpacity>
          </View>

          {/* What we can/cannot detect — Suleyman */}
          <View style={styles.transparencyCard}>
            <Text style={styles.transparencyTitle}>What Custorian can detect</Text>
            <Text style={styles.transparencyText}>Grooming patterns, bullying, self-harm language, violence threats, harmful content trends, sextortion, dangerous purchases — in English, Danish, German, and Arabic.</Text>
            <Text style={[styles.transparencyTitle, { marginTop: 12 }]}>What it cannot</Text>
            <Text style={styles.transparencyText}>Sarcasm, inside jokes, images without cloud analysis, novel techniques not in our pattern library. This app is a layer of protection, not a guarantee.</Text>
          </View>

          <Text style={styles.version}>Custorian Standard v0.1 · Open Source · custorian.org</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // Hero
  hero: { backgroundColor: Colors.navy, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, marginBottom: Spacing.lg },
  heroBrand: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  menuBtn: { position: 'relative' },
  menuBtnInner: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  hexDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.3)' },
  badge: { position: 'absolute', top: -3, right: -3, backgroundColor: Colors.danger, borderRadius: 9, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.navy },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Status
  statusBlock: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center' },
  statusSafe: { backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  statusOff: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statusOrb: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  statusOrbInner: { width: 20, height: 20, borderRadius: 10 },
  statusHeadline: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 4 },
  statusDetail: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: Spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  // Content
  content: { padding: Spacing.lg, paddingTop: Spacing.xl },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMute, letterSpacing: 2.5, marginBottom: Spacing.sm, marginTop: Spacing.sm },

  // Chips
  chipScroll: { marginBottom: Spacing.lg, marginHorizontal: -Spacing.lg },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  chipDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.text },

  // Primary cards
  primaryCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm, ...Shadow.sm },
  primaryDot: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  primaryDotInner: { width: 14, height: 14, borderRadius: 7 },
  primaryTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  primarySub: { fontSize: 12, color: Colors.textDim, lineHeight: 17 },
  chevron: { fontSize: 24, color: Colors.textMute, fontWeight: '300', marginLeft: 8 },

  // Alert
  alertCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.danger + '30', marginTop: Spacing.md, ...Shadow.sm },
  alertNum: { fontSize: 28, fontWeight: '800', color: Colors.danger, marginRight: Spacing.md },
  alertTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  alertUrgent: { fontSize: 12, color: Colors.danger, fontWeight: '600', marginTop: 2 },

  // Invite
  inviteCard: { backgroundColor: Colors.accentLight, borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.lg, borderWidth: 1, borderColor: Colors.primary + '20' },
  inviteTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  inviteSub: { fontSize: 12, color: Colors.primary + '80', marginTop: 2 },

  // Secondary
  secondaryRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.lg },
  secondaryBtn: { flex: 1, backgroundColor: '#fff', borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  secondaryText: { fontSize: 11, fontWeight: '600', color: Colors.textDim },

  // Transparency
  transparencyCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.lg, marginTop: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  transparencyTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  transparencyText: { fontSize: 12, color: Colors.textDim, lineHeight: 18 },

  // Version
  version: { fontSize: 9, color: Colors.textMute, textAlign: 'center', letterSpacing: 1, marginTop: Spacing.xl, opacity: 0.5 },
});
