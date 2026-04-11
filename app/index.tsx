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
      <Text style={styles.icon}>🛡️</Text>
      <Text style={styles.title}>Custodian</Text>
      <Text style={styles.subtitle}>Protecting what matters</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.darkSurface },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.white },
  subtitle: { fontSize: 16, color: Colors.textLight, marginTop: 8 },
});
