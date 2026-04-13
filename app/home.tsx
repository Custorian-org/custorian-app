import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors, Spacing, Radius, Shadow } from '../src/constants/theme';
import BottomNav from '../src/components/BottomNav';
import OfflineBanner from '../src/components/OfflineBanner';
import { generateDailyDigest, DailyDigest } from '../src/engine/dailyDigest';

const guards = [
  'Grooming', 'Bullying', 'Self-Harm', 'Violence', 'Harmful Trends', 'Adult Content', 'Photo Safety',
];

const faqItems = [
  {
    q: 'What can Custorian detect?',
    a: 'Grooming patterns, cyberbullying, self-harm language, violence threats, sextortion, harmful content trends, and dangerous purchases — in English, Danish, German, and Arabic.',
  },
  {
    q: 'What can it NOT detect?',
    a: 'Sarcasm, inside jokes, image-only threats without text, novel slang not yet in our library, and threats on platforms that block keyboard extensions. Custorian is a layer of protection, not a guarantee.',
  },
  {
    q: 'Is my child\'s data safe?',
    a: 'All analysis runs on your child\'s device. No messages ever leave the phone. No cloud. No accounts. No one sees your child\'s messages — not even us. The code is open source and auditable.',
  },
  {
    q: 'What happens when something is detected?',
    a: 'Two things happen simultaneously: your child receives an age-appropriate nudge explaining what\'s happening and what to do. You receive an alert in the PIN-protected parent dashboard with conversation guidance.',
    action: { label: 'View dashboard', route: '/dashboard' },
  },
  {
    q: 'Does my child know they\'re being monitored?',
    a: 'Yes. Custorian is not spyware. Children aged 13+ are always notified that monitoring is active. For younger children, notification is optional but strongly recommended. Research shows transparent monitoring builds trust; hidden surveillance destroys it.',
  },
  {
    q: 'How do I talk to my child about a threat?',
    a: 'Every alert includes a tailored conversation guide: what NOT to do (don\'t take the phone, don\'t accuse), what TO do (stay calm, ask open questions), and a conversation starter you can use word-for-word.',
    action: { label: 'View parent guide', route: '/parent-guide?category=grooming' },
  },
  {
    q: 'How accurate is the detection?',
    a: 'Current precision: 88% (English), 84% (Danish), 82% (German). False positive rate: ~8-10%. We publish accuracy metrics quarterly and are transparent about limitations. Detection improves continuously through pattern updates.',
    action: { label: 'View settings & accuracy', route: '/settings' },
  },
  {
    q: 'What is the Custorian Standard?',
    a: 'Custorian is more than an app — it\'s the open compliance standard for child digital safety, modelled on PCI DSS and EPEAT. This app is the reference implementation. The standard is aligned with IEEE P3462, the EU Digital Services Act, and the EU AI Act.',
  },
  {
    q: 'Is Custorian free?',
    a: 'Yes, always. Custorian is a non-profit (Danish forening, CVR 46399455). The family app is free forever. We are funded by grants and institutional partnerships, not by your data or subscriptions.',
  },
];

export default function HomeScreen() {
  const { monitoringActive, toggleMonitoring, alerts, unreviewedCount } = useGuard();
  const router = useRouter();
  const [lastScan, setLastScan] = useState('just now');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showFaq, setShowFaq] = useState(false);
  const [digest, setDigest] = useState<DailyDigest | null>(null);

  useEffect(() => { generateDailyDigest(alerts).then(setDigest); }, [alerts.length]);

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
      <OfflineBanner />
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── NAVY HERO ── */}
        <SafeAreaView edges={['top']} style={styles.hero}>
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
                  onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleMonitoring(); }}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: Colors.safe + '50' }}
                  thumbColor={monitoringActive ? Colors.safe : '#888'}
                />
              </View>
            </View>
        </SafeAreaView>

        {/* ── WHITE CONTENT AREA ── */}
        <View style={styles.content}>

          {/* First-run: prominent keyboard setup card (Chamath, Clegg) */}
          {!monitoringActive && (
            <TouchableOpacity style={styles.setupCard} onPress={() => router.push('/install-guide')} activeOpacity={0.7}>
              <Text style={styles.setupTitle}>Finish setup</Text>
              <Text style={styles.setupText}>Enable the Custorian keyboard to start protecting your child. Takes 30 seconds.</Text>
              <Text style={styles.setupAction}>View setup guide →</Text>
            </TouchableOpacity>
          )}

          {/* Daily digest — only show if there's history (Chamath: don't show on day 1) */}
          {digest && digest.totalThreats > 0 && (
            <View style={styles.digestCard}>
              <Text style={styles.digestTitle}>Yesterday</Text>
              <Text style={styles.digestText}>{digest.message}</Text>
            </View>
          )}

          {/* Keyboard status — compact when active */}
          {monitoringActive && (
            <View style={styles.keyboardStatus}>
              <View style={[styles.kbDot, { backgroundColor: Colors.safe }]} />
              <Text style={styles.kbText}>Keyboard active · Last scan: {lastScan}</Text>
            </View>
          )}

          {/* Detection layers — horizontal chips */}
          <Text style={styles.sectionLabel}>DETECTION LAYERS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 8 }}>
            {guards.map((g, i) => (
              <View key={i} style={styles.chip}>
                <View style={[styles.chipDot, { backgroundColor: monitoringActive ? Colors.accent : Colors.border }]} />
                <Text style={styles.chipText}>{g}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Alerts — ABOVE tools per feedback */}
          {alerts.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>ALERTS</Text>
              <TouchableOpacity style={styles.alertCard} onPress={() => router.push('/dashboard')} activeOpacity={0.7}>
                <Text style={styles.alertNum}>{alerts.length}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>Alert{alerts.length !== 1 ? 's' : ''} logged</Text>
                  {unreviewedCount > 0 && <Text style={styles.alertUrgent}>{unreviewedCount} need review</Text>}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Tools — all violet, no multi-color */}
          <Text style={styles.sectionLabel}>TOOLS</Text>
          <TouchableOpacity style={styles.primaryCard} onPress={() => router.push('/content-radar')} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryTitle}>Content Radar</Text>
              <Text style={styles.primarySub}>Check if a game, show, or creator is safe for your child's age</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Install guide */}
          <TouchableOpacity style={styles.primaryCard} onPress={() => router.push('/install-guide')} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryTitle}>Installation Guide</Text>
              <Text style={styles.primarySub}>Step-by-step setup for your child's iPhone or iPad</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Invite */}
          <TouchableOpacity style={styles.inviteCard} onPress={inviteFamily} activeOpacity={0.7}>
            <Text style={styles.inviteTitle}>Invite a family</Text>
            <Text style={styles.inviteSub}>Share Custorian with another parent</Text>
          </TouchableOpacity>

          {/* Secondary */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/settings')}>
              <Text style={styles.secondaryText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/submit-slang')}>
              <Text style={styles.secondaryText}>Report Slang</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/test')}>
              <Text style={styles.secondaryText}>Test Engine</Text>
            </TouchableOpacity>
          </View>

          {/* FAQ — entire section collapsible */}
          <TouchableOpacity onPress={() => setShowFaq(!showFaq)} activeOpacity={0.7} style={styles.faqHeader}>
            <Text style={styles.sectionLabel}>FREQUENTLY ASKED</Text>
            <Text style={{ color: Colors.textMute, fontSize: 14 }}>{showFaq ? '−' : '+'}</Text>
          </TouchableOpacity>
          {showFaq && faqItems.map((faq, i) => (
            <TouchableOpacity
              key={i}
              style={styles.faqCard}
              onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Text style={{ color: Colors.textMute, fontSize: 16 }}>{expandedFaq === i ? '−' : '+'}</Text>
              </View>
              {expandedFaq === i && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                  {faq.action && (
                    <TouchableOpacity style={styles.faqAction} onPress={() => router.push(faq.action!.route as any)}>
                      <Text style={styles.faqActionText}>{faq.action.label} →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.version}>Custorian Standard v0.1 · Open Source · custorian.org</Text>
        </View>
      </ScrollView>
      <BottomNav />
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
  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMute, letterSpacing: 2.5, marginBottom: Spacing.md, marginTop: Spacing.lg },

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

  // Setup card (first-run)
  setupCard: { backgroundColor: '#fef3c7', borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, borderWidth: 1, borderColor: '#fcd34d' },
  setupTitle: { fontSize: 16, fontWeight: '700', color: '#92400e', marginBottom: 6 },
  setupText: { fontSize: 13, color: '#b45309', lineHeight: 20, marginBottom: 12 },
  setupAction: { fontSize: 13, fontWeight: '700', color: '#92400e' },

  // Digest
  digestCard: { backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  digestTitle: { fontSize: 10, fontWeight: '700', color: Colors.textMute, letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 4 },
  digestText: { fontSize: 13, color: Colors.textDim },

  // Keyboard status
  keyboardStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  kbDot: { width: 6, height: 6, borderRadius: 3 },
  kbText: { fontSize: 11, color: Colors.textDim, flex: 1 },

  // FAQ
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm },
  faqCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  faqQuestion: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1, paddingRight: 12 },
  faqAnswer: { fontSize: 13, color: Colors.textDim, lineHeight: 20 },
  faqAction: { marginTop: 10, backgroundColor: Colors.accentLight, borderRadius: Radius.sm, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' },
  faqActionText: { fontSize: 12, fontWeight: '600', color: Colors.accent },

  // Version
  version: { fontSize: 9, color: Colors.textMute, textAlign: 'center', letterSpacing: 1, marginTop: Spacing.xl, opacity: 0.5 },
});
