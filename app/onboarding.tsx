import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const pages = [
  {
    step: '01',
    title: 'Welcome to Custorian',
    body: 'An on-device safety tool that detects grooming, bullying, self-harm signals, and violence in your child\'s digital communications.',
    detail: 'Custorian is a reference implementation of the Custorian Controls Framework — the open standard for child digital safety.',
  },
  {
    step: '02',
    title: 'Your child knows it\'s here',
    body: 'This is not spyware. Your child will see age-appropriate guidance when threats are detected. They\'ll know monitoring is active.',
    detail: 'Children aged 13+ are always notified. For younger children, notification is optional but recommended. Trust works better than secrecy.',
  },
  {
    step: '03',
    title: 'Everything stays on this device',
    body: 'All analysis runs locally. No messages leave the phone. No cloud. No accounts. No data collection.',
    detail: 'The detection engine uses on-device NLP in 4 languages (English, Danish, German, Arabic). Open source — every line of code is public.',
  },
  {
    step: '04',
    title: 'You get alerts. They get guidance.',
    body: 'When a threat is detected, you receive an alert with a conversation guide. Your child receives an age-appropriate nudge with real consequences explained.',
    detail: 'Alerts include: what happened, severity level, and exactly how to talk to your child about it — including what NOT to do.',
  },
  {
    step: '05',
    title: 'Set up in 2 minutes',
    body: 'Next: create a 4-digit parent PIN. Then enable the Custorian keyboard in your device settings. That\'s it.',
    detail: 'Go to Settings → Keyboards → Add New Keyboard → Custorian. Enable "Full Access" (required for threat detection). The keyboard looks and works like your normal keyboard.',
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  function next() {
    if (page < pages.length - 1) {
      flatListRef.current?.scrollToIndex({ index: page + 1 });
      setPage(page + 1);
    } else {
      router.replace('/pin-setup');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>{item.step}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <View style={styles.detailCard}>
              <Text style={styles.detailText}>{item.detail}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.bottom}>
        <View style={styles.dots}>
          {pages.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={next}>
          <Text style={styles.buttonText}>
            {page < pages.length - 1 ? 'Next' : 'Create PIN'}
          </Text>
        </TouchableOpacity>
        {page > 0 && (
          <TouchableOpacity onPress={() => { flatListRef.current?.scrollToIndex({ index: page - 1 }); setPage(page - 1); }} style={{ marginTop: 12 }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  page: { width, padding: Spacing.xl, paddingTop: 80, alignItems: 'center' },
  stepBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  stepText: { fontSize: 14, fontWeight: '800', color: Colors.accent },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: Spacing.md, letterSpacing: -0.5 },
  body: { fontSize: 15, color: Colors.textDim, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg, maxWidth: 320 },
  detailCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, width: '100%' },
  detailText: { fontSize: 13, color: Colors.textMute, lineHeight: 20, textAlign: 'center' },
  bottom: { padding: Spacing.xl, alignItems: 'center' },
  dots: { flexDirection: 'row', marginBottom: Spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border, marginHorizontal: 4 },
  dotActive: { width: 24, backgroundColor: Colors.accent },
  button: { backgroundColor: Colors.accent, paddingVertical: 16, paddingHorizontal: 48, borderRadius: Radius.pill, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backText: { fontSize: 14, color: Colors.accent },
});
