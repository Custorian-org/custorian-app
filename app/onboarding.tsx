import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/constants/theme';
import { trackEvent } from '../src/engine/analytics';

const { width } = Dimensions.get('window');

const pages = [
  {
    step: '01',
    title: 'Custorian protects your child online',
    body: 'On-device AI detects grooming, bullying, self-harm, violence, and exploitation across all messaging apps. Your child gets guidance. You get alerts.',
    detail: 'Example alert: "Grooming risk detected — an unknown adult is asking your child personal questions on Discord." You\'ll get a conversation guide with exactly what to say.',
  },
  {
    step: '02',
    title: 'Enable the keyboard',
    body: 'After setting your PIN, go to Settings → General → Keyboard → Keyboards → Add → Custorian. Then enable "Allow Full Access."',
    detail: '✓ Analyses text on your device only\n✗ Does not send data anywhere\n✓ Same permission as Gboard/SwiftKey\n\nOpen source — verify yourself at custorian.org',
  },
  {
    step: '03',
    title: 'Create your parent PIN',
    body: 'Set a 4-digit PIN to protect the parent dashboard. Only you can see alerts and settings. Your child cannot access them.',
    detail: 'Choose something your child won\'t guess. You can change it anytime in Settings.',
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => { trackEvent('onboarding_started'); }, []);

  function next() {
    if (page < pages.length - 1) {
      const nextPage = page + 1;
      if (nextPage === 1) trackEvent('onboarding_step2');
      if (nextPage === 2) trackEvent('onboarding_step3');
      flatListRef.current?.scrollToIndex({ index: nextPage });
      setPage(nextPage);
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
