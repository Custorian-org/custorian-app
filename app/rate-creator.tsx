import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/constants/theme';
import { submitRating, CommunityRating } from '../src/engine/communityRatings';

// ── THEME CHIPS ─────────────────────────────────────────────
const THEME_OPTIONS: { value: string; label: string }[] = [
  { value: 'violence', label: 'Violence' },
  { value: 'profanity', label: 'Profanity' },
  { value: 'sexual', label: 'Sexual' },
  { value: 'body-image', label: 'Body image' },
  { value: 'gambling', label: 'Gambling' },
  { value: 'drugs', label: 'Drugs' },
  { value: 'bullying', label: 'Bullying' },
  { value: 'positive', label: 'Positive' },
  { value: 'educational', label: 'Educational' },
  { value: 'creativity', label: 'Creativity' },
];

const WATCH_OPTIONS: { value: CommunityRating['wouldLetChildWatch']; label: string; icon: string }[] = [
  { value: 'yes', label: 'Yes', icon: '✅' },
  { value: 'with_discussion', label: 'With discussion', icon: '💬' },
  { value: 'no', label: 'No', icon: '🚫' },
];

const CHILD_AGES = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export default function RateCreatorScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();

  const [creatorName, setCreatorName] = useState(name || '');
  const [ageRec, setAgeRec] = useState(12);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [wouldWatch, setWouldWatch] = useState<CommunityRating['wouldLetChildWatch'] | ''>('');
  const [parentNote, setParentNote] = useState('');
  const [childAge, setChildAge] = useState(10);
  const [submitted, setSubmitted] = useState(false);

  const toggleTheme = (t: string) => {
    setSelectedThemes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleSubmit = async () => {
    if (!creatorName.trim()) {
      Alert.alert('Missing creator', 'Please enter the creator or channel name.');
      return;
    }
    if (!wouldWatch) {
      Alert.alert('Missing field', 'Please select whether you\'d let your child watch.');
      return;
    }

    const rating: CommunityRating = {
      creatorName: creatorName.trim(),
      ageRecommendation: ageRec,
      themes: selectedThemes,
      wouldLetChildWatch: wouldWatch,
      parentNote: parentNote.trim(),
      childAge,
      timestamp: new Date().toISOString(),
    };

    try {
      await submitRating(rating);
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Could not submit rating. Please try again.');
    }
  };

  // ── SUCCESS STATE ───────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Rating submitted!</Text>
          <Text style={styles.successText}>
            Thank you for helping other parents. Your rating for {creatorName} has been saved.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              setSubmitted(false);
              setCreatorName('');
              setAgeRec(12);
              setSelectedThemes([]);
              setWouldWatch('');
              setParentNote('');
            }}
          >
            <Text style={styles.primaryBtnText}>Rate Another</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>← Back to Content Radar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── FORM ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rate a Creator</Text>
        <Text style={styles.subtitle}>Help other parents by sharing your experience</Text>

        {/* Creator name */}
        <Text style={styles.label}>CREATOR / CHANNEL NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. MrBeast, Cocomelon..."
          placeholderTextColor={Colors.textMute}
          value={creatorName}
          onChangeText={setCreatorName}
        />

        {/* Age recommendation slider */}
        <Text style={styles.label}>MINIMUM AGE RECOMMENDATION</Text>
        <View style={styles.ageSliderRow}>
          {[8, 10, 12, 14, 16, 18].map((age) => (
            <TouchableOpacity
              key={age}
              style={[styles.ageBubble, ageRec === age && styles.ageBubbleActive]}
              onPress={() => setAgeRec(age)}
            >
              <Text style={[styles.ageBubbleText, ageRec === age && styles.ageBubbleTextActive]}>
                {age}+
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme chips */}
        <Text style={styles.label}>THEMES (select all that apply)</Text>
        <View style={styles.chipWrap}>
          {THEME_OPTIONS.map((t) => {
            const selected = selectedThemes.includes(t.value);
            const isPositive = ['positive', 'educational', 'creativity'].includes(t.value);
            return (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.chip,
                  selected && (isPositive ? styles.chipSelectedSafe : styles.chipSelectedDanger),
                ]}
                onPress={() => toggleTheme(t.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && (isPositive ? styles.chipTextSafe : styles.chipTextDanger),
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Would you let your child watch? */}
        <Text style={styles.label}>WOULD YOU LET YOUR CHILD WATCH?</Text>
        <View style={styles.watchRow}>
          {WATCH_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.watchBtn, wouldWatch === opt.value && styles.watchBtnActive]}
              onPress={() => setWouldWatch(opt.value)}
            >
              <Text style={styles.watchIcon}>{opt.icon}</Text>
              <Text style={[styles.watchLabel, wouldWatch === opt.value && styles.watchLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Parent note */}
        <Text style={styles.label}>ONE-LINE NOTE (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="What should other parents know?"
          placeholderTextColor={Colors.textMute}
          value={parentNote}
          onChangeText={setParentNote}
          maxLength={200}
        />

        {/* Child age */}
        <Text style={styles.label}>YOUR CHILD'S AGE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.childAgeRow}>
            {CHILD_AGES.map((age) => (
              <TouchableOpacity
                key={age}
                style={[styles.childAgeBubble, childAge === age && styles.childAgeBubbleActive]}
                onPress={() => setChildAge(age)}
              >
                <Text style={[styles.childAgeText, childAge === age && styles.childAgeTextActive]}>
                  {age}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Submit */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
          <Text style={styles.primaryBtnText}>Submit Rating</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg },

  backBtn: { fontSize: 14, color: Colors.accent, marginBottom: Spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.textDim, marginTop: 4, marginBottom: Spacing.lg },

  label: {
    fontSize: 10, fontWeight: '700', color: Colors.textMute,
    letterSpacing: 2.5, marginBottom: Spacing.sm, marginTop: Spacing.lg,
  },

  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },

  // Age recommendation bubbles
  ageSliderRow: { flexDirection: 'row', gap: Spacing.sm },
  ageBubble: {
    width: 48, height: 40, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card,
  },
  ageBubbleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  ageBubbleText: { fontSize: 14, fontWeight: '700', color: Colors.textDim },
  ageBubbleTextActive: { color: '#ffffff' },

  // Theme chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  chipSelectedDanger: { backgroundColor: Colors.danger + '15', borderColor: Colors.danger + '40' },
  chipSelectedSafe: { backgroundColor: Colors.safe + '15', borderColor: Colors.safe + '40' },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textDim },
  chipTextDanger: { color: Colors.danger },
  chipTextSafe: { color: Colors.safe },

  // Would watch
  watchRow: { flexDirection: 'row', gap: Spacing.sm },
  watchBtn: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.md,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  watchBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  watchIcon: { fontSize: 20, marginBottom: 4 },
  watchLabel: { fontSize: 12, fontWeight: '600', color: Colors.textDim },
  watchLabelActive: { color: Colors.accent },

  // Child age
  childAgeRow: { flexDirection: 'row', gap: Spacing.sm },
  childAgeBubble: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card,
  },
  childAgeBubbleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  childAgeText: { fontSize: 14, fontWeight: '700', color: Colors.textDim },
  childAgeTextActive: { color: '#ffffff' },

  // Submit
  primaryBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.md,
    paddingVertical: 16, alignItems: 'center', marginTop: Spacing.xl,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },

  // Success
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  successIcon: { fontSize: 48, marginBottom: Spacing.md },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  successText: { fontSize: 14, color: Colors.textDim, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  backLink: { marginTop: Spacing.md },
  backLinkText: { fontSize: 14, color: Colors.accent },
});
