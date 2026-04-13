import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors } from '../src/constants/theme';
import { trackEvent } from '../src/engine/analytics';

export default function SplashScreen() {
  const router = useRouter();
  const { isOnboarded } = useGuard();
  const pulse = useRef(new Animated.Value(0.4)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackEvent('total_sessions');

    // Pulse animation on the orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Fade in text
    Animated.timing(fadeIn, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      router.replace(isOnboarded ? '/home' : '/onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, [isOnboarded]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.orb, { opacity: pulse }]} />
      <Animated.View style={{ opacity: fadeIn, alignItems: 'center' }}>
        <Text style={styles.title}>Custorian</Text>
        <Text style={styles.subtitle}>Connecting to Custorian Standard v0.1</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  orb: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.accent, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, letterSpacing: -1 },
  subtitle: { fontSize: 10, color: Colors.textMute, marginTop: 8, letterSpacing: 1.5 },
});
