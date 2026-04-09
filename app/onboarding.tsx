import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const pages = [
  { icon: '🛡️', title: 'Welcome to GuardLayer', body: 'A safety tool that helps protect your child from online threats — grooming, bullying, self-harm signals, and violence.' },
  { icon: '👁️', title: 'Transparent Protection', body: 'Your child knows this app is here. It monitors chat messages for harmful patterns and gently intervenes when risk is detected.' },
  { icon: '🔒', title: 'Privacy First', body: "All analysis happens on this device. No data is sent to the cloud. No one sees your child's messages — not even us." },
  { icon: '🔔', title: 'Parent Dashboard', body: "You'll receive alerts when risks are detected. Review flagged conversations and take action — all protected behind your PIN." },
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
    <View style={styles.container}>
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
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {pages.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={next}>
          <Text style={styles.buttonText}>
            {page < pages.length - 1 ? 'Next' : 'Set Up PIN'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  page: { width, padding: 40, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: Colors.text },
  body: { fontSize: 16, textAlign: 'center', color: Colors.textLight, lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd', marginHorizontal: 4 },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  footer: { padding: 24 },
  button: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
