import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors } from '../src/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { isOnboarded } = useGuard();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(isOnboarded ? '/home' : '/onboarding');
    }, 1500);
    return () => clearTimeout(timer);
  }, [isOnboarded]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Custorian</Text>
      <Text style={styles.subtitle}>Protecting the innocent</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  title: { fontSize: 36, fontWeight: '800', color: Colors.text, letterSpacing: -1.5 },
  subtitle: { fontSize: 13, color: Colors.textMute, marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' },
});
