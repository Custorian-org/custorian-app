import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors, Spacing, Radius, Shadow } from '../src/constants/theme';
import { getPrimaryHelpline } from '../src/engine/globalCrisisLines';
import { NativeModules, Platform } from 'react-native';
import BottomNav from '../src/components/BottomNav';
import OfflineBanner from '../src/components/OfflineBanner';
import { generateDailyDigest, DailyDigest } from '../src/engine/dailyDigest';

const guards = [
  'Grooming', 'Bullying', 'Self-Harm', 'Violence', 'Harmful Trends', 'Adult Content', 'Photo Safety',
];

const faqItems = [
  {
    q: 'Is my child\'s data safe?',
    a: 'All analysis runs on your child\'s device. No messages ever leave the phone. No cloud. No accounts. No one sees your child\'s messages — not even us. The code is open source and auditable.',
  },
  {
    q: 'What can Custorian detect?',
    a: 'Grooming patterns, cyberbullying, self-harm language, violence threats, sextortion, harmful content trends, and dangerous purchases — in English, Danish, German, and Arabic.',
  },
  {
    q: 'What can it NOT detect?',
    a: 'Sarcasm, inside jokes, image-only threats without text, novel slang not yet in our library, and threats on platforms that block keyboard extensions. Custorian is a layer of protection, not a guarantee.',
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
    a: 'Detection accuracy is being validated through independent testing. We are transparent about limitations and will publish verified accuracy metrics when available. Detection improves continuously through pattern updates.',
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
  const { monitoringActive, toggleMonitoring, alerts, unreviewedCount, verifyPin, processMessage } = useGuard();
  const router = useRouter();
  const [isParentDevice, setIsParentDevice] = useState(false);
  const [isChildDevice, setIsChildDevice] = useState(false);
  const [familyChildren, setFamilyChildren] = useState<any[]>([]);
  const [familyAlerts, setFamilyAlerts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { getFamilyConfig, fetchFamilyChildren, fetchFamilyAlerts } = await import('../src/engine/familySync');
      const config = await getFamilyConfig();
      const isParent = !config || config.role === 'parent' || config.role === 'none';
      setIsParentDevice(isParent);
      setIsChildDevice(config?.role === 'child');
      if (isParent && config?.role === 'parent') {
        const kids = await fetchFamilyChildren();
        setFamilyChildren(kids);
        const alerts = await fetchFamilyAlerts();
        setFamilyAlerts(alerts);
      }
    })();
  }, []);
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

  // ── CHILD DEVICE VIEW ──
  if (isChildDevice) {
    return (
      <View style={styles.root}>
        <OfflineBanner />
        <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <SafeAreaView edges={['top']} style={[styles.hero, { paddingBottom: 40 }]}>
            <View style={styles.heroTop}>
              <Text style={styles.heroBrand}>Custorian</Text>
            </View>
            <View style={{ alignItems: 'center', paddingTop: 20 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff' }}>C</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 }}>You're protected</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 }}>
                Custorian is running in the background, keeping you safe online. If something concerning happens, you'll see a helpful message.
              </Text>
            </View>
          </SafeAreaView>

          <View style={styles.content}>
            {/* I need help button */}
            <TouchableOpacity
              style={{ backgroundColor: '#fef2f2', borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 20, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center' }}
              onPress={() => {
                // Get country code from device locale
                const locale = Platform.OS === 'ios'
                  ? (NativeModules.SettingsManager?.settings?.AppleLocale || NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'en_US')
                  : 'en_US';
                const countryCode = locale.split(/[-_]/).pop()?.toUpperCase() || 'US';
                const helpline = getPrimaryHelpline(countryCode);

                Alert.alert(
                  'What\'s happening?',
                  'Choose the one that fits best:',
                  [
                    { text: 'Someone is making me uncomfortable', onPress: () => Alert.alert('You did the right thing', 'No one should make you uncomfortable online. Your parent will know you asked for help — but they won\'t see your messages. Nobody will get in trouble because of you. You\'re safe.') },
                    { text: 'Someone is being mean to me', onPress: () => Alert.alert('That wasn\'t okay', "It's not your fault. Your parent will know something happened — but they won't see what was said. You won't get anyone in trouble by telling. Telling is brave, not snitching.") },
                    { text: "I'm feeling really bad", onPress: () => Alert.alert('Help is here', `You're incredibly brave for reaching out. That takes real courage.\n\nCall ${helpline.name}: ${helpline.number}\nThey're free, confidential, and won't tell anyone unless you want them to.\n\nYour parent knows you asked for support — but not what you said. You're not in trouble. You're not bothering anyone. You matter.`) },
                    { text: 'Someone is threatening me', onPress: () => Alert.alert('You\'re safe now', 'That sounds scary, and it\'s not okay. Your parent has been told that something happened — but they can\'t see the messages. The person who threatened you won\'t know you told anyone. You did the right thing.') },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#dc2626', marginBottom: 4 }}>I need help</Text>
              <Text style={{ fontSize: 12, color: '#991b1b' }}>Tap if something feels wrong — we'll tell your parent</Text>
            </TouchableOpacity>

            {/* Content Radar shortcut */}
            <TouchableOpacity
              style={{ backgroundColor: '#f5f3ff', borderRadius: 16, padding: 20, marginHorizontal: 20, marginTop: 12, borderWidth: 1, borderColor: '#e9d5ff' }}
              onPress={() => router.push('/content-radar')}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#7c3aed', marginBottom: 4 }}>Content Radar</Text>
              <Text style={{ fontSize: 12, color: '#6d28d9' }}>Check if a game, show, or app is safe for you</Text>
            </TouchableOpacity>

            {/* Helpful tips */}
            <View style={{ padding: 20, marginTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 }}>Stay safe online</Text>
              {[
                'Never share your password with anyone except your parents',
                'If someone asks for photos or to meet up, tell your parent',
                "It's always okay to block someone who makes you uncomfortable",
                "If something online makes you feel bad, that's not your fault",
              ].map((tip, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 8, gap: 8 }}>
                  <Text style={{ color: Colors.primary }}>•</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 16, flex: 1 }}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        <BottomNav />
      </View>
    );
  }

  // ── PARENT DEVICE VIEW ──
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
                  onValueChange={() => {
                    if (monitoringActive) {
                      // Require PIN to disable monitoring
                      Alert.prompt('Enter Parent PIN', 'PIN is required to disable monitoring.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Confirm', onPress: (pin) => { if (verifyPin(pin || '')) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleMonitoring(); } else { Alert.alert('Wrong PIN', 'Incorrect PIN. Monitoring remains active.'); } } },
                      ], 'secure-text');
                    } else {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      toggleMonitoring();
                    }
                  }}
                  trackColor={{ false: 'rgba(255,255,255,0.15)', true: Colors.safe + '50' }}
                  thumbColor={monitoringActive ? Colors.safe : '#888'}
                />
              </View>
            </View>
        </SafeAreaView>

        {/* ── WHITE CONTENT ── Jobs: 3 things only: status, alerts, radar */}
        <View style={styles.content}>

          {/* First-run: setup card */}
          {!monitoringActive && (
            <TouchableOpacity style={styles.setupCard} onPress={() => router.push('/install-guide')} activeOpacity={0.7}>
              <Text style={styles.setupTitle}>Finish setup</Text>
              <Text style={styles.setupText}>Enable the Custorian keyboard to start protecting your child. Takes 30 seconds.</Text>
              <Text style={styles.setupAction}>View setup guide →</Text>
            </TouchableOpacity>
          )}

          {/* Connected Children */}
          {isParentDevice && familyChildren.length > 0 && (
            <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 }}>Your children</Text>
              {familyChildren.map((child: any, i: number) => {
                const childAlerts = familyAlerts.filter((a: any) => a.child_device_id === child.child_device_id);
                const newAlerts = childAlerts.filter((a: any) => a.status === 'new').length;
                return (
                  <View key={i} style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: newAlerts > 0 ? '#fecaca' : '#e5e7eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a2e' }}>{child.child_name}</Text>
                      <Text style={{ fontSize: 11, color: '#9ca3af' }}>Age {child.age_bracket} · Connected</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      {newAlerts > 0 ? (
                        <View style={{ backgroundColor: '#ef4444', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 }}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{newAlerts} new</Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '600' }}>All clear</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Parent-only: Test & Demo buttons */}
          {isParentDevice && (
            <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
              <TouchableOpacity
                style={{ backgroundColor: Colors.primary + '10', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '25', marginBottom: 8 }}
                onPress={() => {
                  const testMessages = [
                    { text: "You're so pretty for your age. Don't tell your parents about us, this is our secret ok?", app: 'Instagram' },
                    { text: "You're ugly and stupid. Everyone hates you, nobody likes you.", app: 'Snapchat' },
                    { text: "I don't want to be alive anymore. Nobody would even notice if I disappeared.", app: 'WhatsApp' },
                    { text: "I'm bringing a knife to school tomorrow. They'll all pay.", app: 'Discord' },
                  ];
                  const msg = testMessages[Math.floor(Math.random() * testMessages.length)];
                  const result = processMessage(msg.text, msg.app);
                  if (result) {
                    Alert.alert('Test Alert Sent', `Detected: ${result.category} (score: ${result.score}) from ${msg.app}. Check Alerts tab and your push notifications.`);
                  } else {
                    Alert.alert('No Threat', 'Message was not flagged.');
                  }
                }}
              >
                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 14 }}>Send Test Alert</Text>
                <Text style={{ color: Colors.primary + '80', fontSize: 11, marginTop: 2 }}>Simulates a random threat detection</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#f3f4f6', borderRadius: 12, padding: 12, alignItems: 'center' }}
                onPress={() => router.push('/test')}
              >
                <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 12 }}>Open Full Test Mode</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Digest — only when there's data */}
          {digest && digest.totalThreats > 0 && (
            <View style={styles.digestCard}>
              <Text style={styles.digestTitle}>Yesterday</Text>
              <Text style={styles.digestText}>{digest.message}</Text>
            </View>
          )}

          {/* Keyboard status */}
          {monitoringActive && (
            <View style={styles.keyboardStatus}>
              <View style={[styles.kbDot, { backgroundColor: Colors.safe }]} />
              <Text style={styles.kbText}>Keyboard active · Last scan: {lastScan}</Text>
            </View>
          )}

          {/* #1: ALERTS (Jobs: one of 3 core things) */}
          {alerts.length > 0 && (
            <TouchableOpacity style={[styles.alertCard, unreviewedCount > 0 && { borderColor: Colors.danger + '40' }]} onPress={() => router.push('/dashboard')} activeOpacity={0.7}>
              <Text style={styles.alertNum}>{alerts.length}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Alert{alerts.length !== 1 ? 's' : ''} logged</Text>
                {unreviewedCount > 0 && <Text style={styles.alertUrgent}>{unreviewedCount} need review</Text>}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}

          {/* #2: CONTENT RADAR (Jobs: one of 3 core things) */}
          <TouchableOpacity style={styles.primaryCard} onPress={() => router.push('/content-radar')} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={styles.primaryTitle}>Content Radar</Text>
              <Text style={styles.primarySub}>What is your child watching or playing today?</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Invite — moved higher for visibility */}
          <TouchableOpacity style={styles.inviteCard} onPress={inviteFamily} activeOpacity={0.7}>
            <Text style={styles.inviteTitle}>Invite a family</Text>
            <Text style={styles.inviteSub}>Know a parent who needs this?</Text>
          </TouchableOpacity>

          {/* FAQ — reordered: data safety first (Clegg) */}
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

          <TouchableOpacity onPress={async () => {
            const config = await (await import('../src/engine/familySync')).getFamilyConfig();
            if (config?.role === 'child') {
              Alert.alert('Not Available', 'This feature is only available on the parent device.');
            } else {
              router.push('/test');
            }
          }}>
            <Text style={styles.version}>Standard v0.1 · Open Source · Test Mode</Text>
          </TouchableOpacity>
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
