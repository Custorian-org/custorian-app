import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '../src/constants/theme';

/**
 * Installation Guide — step-by-step setup for parents.
 * Works on both iPhone and iPad.
 */

const steps = [
  {
    num: '1',
    title: 'Install on your child\'s device',
    body: 'Download Custorian from the App Store on your child\'s iPhone or iPad. Not on your phone — on theirs.',
    note: 'The app needs to be on the device your child uses to message, game, and browse.',
  },
  {
    num: '2',
    title: 'Complete onboarding',
    body: 'Open the app and go through the 5 setup screens. Enter your child\'s age and create a 4-digit parent PIN.',
    note: 'The PIN protects the parent dashboard. Choose something your child won\'t guess.',
  },
  {
    num: '3',
    title: 'Enable the Custorian keyboard',
    body: Platform.OS === 'ios'
      ? 'Go to Settings → General → Keyboard → Keyboards → Add New Keyboard → Custorian. Then tap Custorian → enable "Allow Full Access".'
      : 'Go to Settings → System → Languages & Input → On-screen keyboard → Manage keyboards → enable Custorian.',
    note: '"Full Access" is required so the keyboard can analyse text for threats. No data is sent anywhere — all processing is on-device.',
  },
  {
    num: '4',
    title: 'Set Custorian as active keyboard',
    body: 'When your child opens any messaging app, long-press the globe icon on the keyboard and select Custorian. It looks and works like the normal keyboard.',
    note: 'Your child can switch back to the default keyboard. The detection still runs as long as Custorian is in the keyboard list.',
  },
  {
    num: '5',
    title: 'Configure parental controls',
    body: 'Go to Settings in the app (at the bottom of the home screen). Set screen time limits, contact safety rules, and content filtering level.',
    note: 'Defaults are age-appropriate. You can adjust any time via the PIN-protected settings.',
  },
  {
    num: '6',
    title: 'Talk to your child',
    body: 'Tell them what Custorian does. Explain that it\'s there to keep them safe, not to spy on them. They\'ll see gentle guidance when something concerning happens.',
    note: 'Research shows children respond better to transparent monitoring than hidden surveillance. Trust is the foundation.',
  },
];

const ipadNote = Platform.isPad ? {
  title: 'iPad-specific',
  body: 'Custorian works on iPad. The keyboard extension functions the same way. Screen time tracking covers all apps on the iPad, including Safari and any messaging apps.',
} : null;

export default function InstallGuideScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Installation Guide</Text>
          <Text style={styles.subtitle}>Set up Custorian on your child's {Platform.isPad ? 'iPad' : 'iPhone or iPad'}</Text>
        </View>

        <View style={styles.timeEstimate}>
          <Text style={styles.timeText}>Estimated setup time: 2 minutes</Text>
        </View>

        {steps.map((step, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{step.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>{step.note}</Text>
              </View>
            </View>
          </View>
        ))}

        {ipadNote && (
          <View style={[styles.stepCard, { borderColor: Colors.accent + '30' }]}>
            <View style={[styles.stepNum, { backgroundColor: Colors.accentLight }]}>
              <Text style={[styles.stepNumText, { color: Colors.accent }]}>i</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{ipadNote.title}</Text>
              <Text style={styles.stepBody}>{ipadNote.body}</Text>
            </View>
          </View>
        )}

        <View style={styles.doneCard}>
          <Text style={styles.doneTitle}>You're done</Text>
          <Text style={styles.doneBody}>Custorian is now protecting your child. You'll receive alerts in the parent dashboard (PIN-protected) if anything concerning is detected.</Text>
        </View>

        <TouchableOpacity style={styles.helpLink} onPress={() => Linking.openURL('mailto:info@custorian.org')}>
          <Text style={styles.helpText}>Need help? Email info@custorian.org</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md },
  back: { fontSize: 14, color: Colors.accent, marginBottom: Spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.textMute, marginTop: 4 },

  timeEstimate: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: Colors.accentLight, borderRadius: Radius.pill, alignSelf: 'flex-start' },
  timeText: { fontSize: 12, fontWeight: '600', color: Colors.accent },

  stepCard: {
    flexDirection: 'row', gap: 16, marginHorizontal: Spacing.lg, marginBottom: 16,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  stepNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.navy, justifyContent: 'center', alignItems: 'center' },
  stepNumText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  stepBody: { fontSize: 13, color: Colors.textDim, lineHeight: 20, marginBottom: 8 },
  noteBox: { backgroundColor: Colors.bg, borderRadius: Radius.sm, padding: 10, borderWidth: 1, borderColor: Colors.border },
  noteText: { fontSize: 11, color: Colors.textMute, lineHeight: 16 },

  doneCard: {
    marginHorizontal: Spacing.lg, marginTop: 8, marginBottom: Spacing.lg,
    backgroundColor: '#ecfdf5', borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: '#10b98130',
  },
  doneTitle: { fontSize: 16, fontWeight: '700', color: '#059669', marginBottom: 4 },
  doneBody: { fontSize: 13, color: '#6b7280', lineHeight: 20 },

  helpLink: { alignItems: 'center', paddingVertical: Spacing.lg },
  helpText: { fontSize: 13, color: Colors.accent },
});
