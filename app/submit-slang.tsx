import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/theme';

const LANGUAGES = [
  { code: 'en', label: 'English 🇬🇧' },
  { code: 'da', label: 'Dansk 🇩🇰' },
  { code: 'de', label: 'Deutsch 🇩🇪' },
  { code: 'ar', label: 'العربية 🇸🇦' },
  { code: 'other', label: 'Other' },
];

const CATEGORIES = [
  { code: 'drugs', label: '💊 Drugs / Substances' },
  { code: 'sexual', label: '⚠️ Sexual / Exploitation' },
  { code: 'violence', label: '👊 Violence / Threats' },
  { code: 'bullying', label: '💬 Bullying / Insults' },
  { code: 'selfharm', label: '💜 Self-Harm / Mental Health' },
  { code: 'grooming', label: '🎭 Grooming / Predatory' },
  { code: 'purchase', label: '🛒 Dangerous Purchases' },
  { code: 'radical', label: '🚩 Radicalisation' },
  { code: 'other', label: '❓ Other / Not Sure' },
];

export default function SubmitSlangScreen() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!term.trim() || !meaning.trim() || !language || !category) {
      Alert.alert('Missing fields', 'Please fill in the term, meaning, language, and category.');
      return;
    }

    try {
      // Submit via Web3Forms (same as contact form)
      const formData = new FormData();
      formData.append('access_key', 'cfeb795c-19e4-42ee-9ab3-66290e1c5e34');
      formData.append('subject', `Custorian Slang Submission [${language.toUpperCase()}]`);
      formData.append('slang_term', term.trim());
      formData.append('meaning', meaning.trim());
      formData.append('example', example.trim());
      formData.append('language', language);
      formData.append('category', category);
      formData.append('source', 'app');
      formData.append('timestamp', new Date().toISOString());

      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });

      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Could not submit. Please try again.');
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Thank you!</Text>
          <Text style={styles.successText}>
            Your submission will be reviewed by our team. If approved, it will be added to the detection engine and help protect children everywhere.
          </Text>
          <TouchableOpacity style={styles.submitButton} onPress={() => { setSubmitted(false); setTerm(''); setMeaning(''); setExample(''); setLanguage(''); setCategory(''); }}>
            <Text style={styles.submitButtonText}>Submit Another</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>← Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Report New Slang</Text>
        <Text style={styles.subtitle}>
          Help us keep up with how kids communicate. If you've seen a term, phrase, or coded word that we should know about, submit it here.
        </Text>

        {/* Language */}
        <Text style={styles.label}>Language</Text>
        <View style={styles.chipRow}>
          {LANGUAGES.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.chip, language === l.code && styles.chipActive]}
              onPress={() => setLanguage(l.code)}
            >
              <Text style={[styles.chipText, language === l.code && styles.chipTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Term */}
        <Text style={styles.label}>Slang term or phrase *</Text>
        <TextInput
          style={styles.input}
          placeholder='e.g. "sewerslide", "grippy socks", "za"'
          placeholderTextColor={Colors.textLight}
          value={term}
          onChangeText={setTerm}
        />

        {/* Meaning */}
        <Text style={styles.label}>What does it actually mean? *</Text>
        <TextInput
          style={styles.input}
          placeholder='e.g. "coded word for suicide used to bypass TikTok filters"'
          placeholderTextColor={Colors.textLight}
          value={meaning}
          onChangeText={setMeaning}
          multiline
        />

        {/* Example */}
        <Text style={styles.label}>Example sentence (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder='e.g. "she went on a grippy sock vacation last week"'
          placeholderTextColor={Colors.textLight}
          value={example}
          onChangeText={setExample}
          multiline
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.code}
              style={[styles.chip, category === c.code && styles.chipActive]}
              onPress={() => setCategory(c.code)}
            >
              <Text style={[styles.chipText, category === c.code && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit for Review</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          All submissions are reviewed by our team before being added to the detection engine. We never share who submitted a term.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  back: { fontSize: 15, color: Colors.primary, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textLight, lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 20 },
  input: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, fontSize: 15,
    color: Colors.text, borderWidth: 1, borderColor: '#e5e5e5', minHeight: 48,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: '#e5e5e5',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textLight },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  submitButton: {
    backgroundColor: Colors.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 28,
  },
  submitButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  note: { fontSize: 12, color: Colors.textLight, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  successText: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  backLink: { marginTop: 16 },
  backLinkText: { fontSize: 14, color: Colors.primary },
});
