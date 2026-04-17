import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '../src/constants/theme';
import BottomNav from '../src/components/BottomNav';

/**
 * Parental Controls Settings (CS-PR.2)
 * Contact management, content filtering, screen time, break reminders.
 */

export default function SettingsScreen() {
  const router = useRouter();
  const [blockUnknown, setBlockUnknown] = useState(true);
  const [explicitFilter, setExplicitFilter] = useState('block');
  const [breakReminders, setBreakReminders] = useState(true);
  const [screenTimeLimit, setScreenTimeLimit] = useState(180);
  const [lateNightBlock, setLateNightBlock] = useState(true);
  const [childNotification, setChildNotification] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Parental Controls</Text>
          <Text style={styles.subtitle}>Configure protection settings</Text>
        </View>

        {/* Family Setup */}
        <Text style={styles.sectionLabel}>FAMILY</Text>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/family-setup')}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.settingTitle}>Family Setup</Text>
              <Text style={styles.settingDesc}>Connect parent and child devices</Text>
            </View>
            <Text style={{ fontSize: 18, color: '#9ca3af' }}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Contact safety */}
        <Text style={styles.sectionLabel}>CONTACT SAFETY</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Block unknown contacts</Text>
              <Text style={styles.settingDesc}>Alert when child receives messages from contacts not in their approved list</Text>
            </View>
            <Switch value={blockUnknown} onValueChange={setBlockUnknown} trackColor={{ false: Colors.border, true: Colors.accent + '40' }} thumbColor={blockUnknown ? Colors.accent : '#ccc'} />
          </View>
        </View>

        {/* Content filtering */}
        <Text style={styles.sectionLabel}>CONTENT FILTERING</Text>
        <View style={styles.card}>
          <Text style={styles.settingTitle}>Explicit content</Text>
          <Text style={styles.settingDesc}>How to handle detected explicit images</Text>
          <View style={styles.optionRow}>
            {[
              { value: 'block', label: 'Block' },
              { value: 'blur', label: 'Blur + alert' },
              { value: 'alert', label: 'Alert only' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, explicitFilter === opt.value && styles.optionActive]}
                onPress={() => setExplicitFilter(opt.value)}
              >
                <Text style={[styles.optionText, explicitFilter === opt.value && styles.optionTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Screen time */}
        <Text style={styles.sectionLabel}>SCREEN TIME</Text>
        <View style={styles.card}>
          <Text style={styles.settingTitle}>Daily limit</Text>
          <Text style={styles.settingDesc}>Maximum recommended screen time per day</Text>
          <View style={styles.optionRow}>
            {[
              { value: 120, label: '2 hrs' },
              { value: 180, label: '3 hrs' },
              { value: 240, label: '4 hrs' },
              { value: 360, label: '6 hrs' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, screenTimeLimit === opt.value && styles.optionActive]}
                onPress={() => setScreenTimeLimit(opt.value)}
              >
                <Text style={[styles.optionText, screenTimeLimit === opt.value && styles.optionTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.settingRow, { marginTop: 16 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Late night block</Text>
              <Text style={styles.settingDesc}>Alert on device usage after bedtime cutoff</Text>
            </View>
            <Switch value={lateNightBlock} onValueChange={setLateNightBlock} trackColor={{ false: Colors.border, true: Colors.accent + '40' }} thumbColor={lateNightBlock ? Colors.accent : '#ccc'} />
          </View>

          <View style={[styles.settingRow, { marginTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Break reminders</Text>
              <Text style={styles.settingDesc}>Gentle nudges to take screen breaks (age-appropriate intervals)</Text>
            </View>
            <Switch value={breakReminders} onValueChange={setBreakReminders} trackColor={{ false: Colors.border, true: Colors.accent + '40' }} thumbColor={breakReminders ? Colors.accent : '#ccc'} />
          </View>
        </View>

        {/* Transparency */}
        <Text style={styles.sectionLabel}>TRANSPARENCY</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Notify child that monitoring is active</Text>
              <Text style={styles.settingDesc}>Children aged 13+ are always notified (CS-PR.4.2). For younger children, this is optional but recommended.</Text>
            </View>
            <Switch value={childNotification} onValueChange={setChildNotification} trackColor={{ false: Colors.border, true: Colors.accent + '40' }} thumbColor={childNotification ? Colors.accent : '#ccc'} />
          </View>
        </View>

        {/* Accuracy */}
        <Text style={styles.sectionLabel}>DETECTION</Text>
        <View style={styles.card}>
          <Text style={styles.settingTitle}>Detection accuracy</Text>
          <Text style={styles.settingDesc}>Accuracy metrics are being independently validated and will be published when verified. Custorian is a layer of protection, not a guarantee.</Text>
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <Text style={styles.settingTitle}>Custorian Standard v0.1</Text>
          <Text style={styles.settingDesc}>Reference Implementation · Open Source · MIT Licence</Text>
          <Text style={[styles.settingDesc, { marginTop: 8 }]}>Non-profit association (forening), Odense, Denmark · CVR 46399455</Text>
          <Text style={[styles.settingDesc, { marginTop: 8 }]}>Aligned with IEEE P3462 · EU DSA · EU AI Act</Text>
          <Text style={[styles.settingDesc, { marginTop: 8, color: Colors.accent }]}>custorian.org · github.com/Custorian-org</Text>
        </View>

      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  back: { fontSize: 14, color: Colors.accent, marginBottom: Spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.textMute, marginTop: 4 },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMute, letterSpacing: 2.5, marginBottom: Spacing.sm, marginTop: Spacing.md, paddingHorizontal: Spacing.lg },

  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
    ...Shadow.sm,
  },

  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  settingDesc: { fontSize: 12, color: Colors.textDim, lineHeight: 17 },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  option: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg },
  optionActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  optionText: { fontSize: 12, fontWeight: '500', color: Colors.textDim },
  optionTextActive: { color: Colors.accent, fontWeight: '600' },

  accuracyGrid: { flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  accuracyItem: { backgroundColor: Colors.bg, borderRadius: Radius.md, padding: 12, alignItems: 'center', flex: 1, minWidth: 70 },
  accuracyValue: { fontSize: 18, fontWeight: '800', color: Colors.accent, letterSpacing: -0.5 },
  accuracyLabel: { fontSize: 9, color: Colors.textMute, marginTop: 4, textAlign: 'center' },
});
