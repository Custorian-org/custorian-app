import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors } from '../src/constants/theme';
import * as Haptics from 'expo-haptics';

export default function PinSetupScreen() {
  const [digits, setDigits] = useState<number[]>([]);
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [status, setStatus] = useState('Create a 4-digit parent PIN');
  const [error, setError] = useState(false);
  const { setPin, completeOnboarding } = useGuard();
  const router = useRouter();

  function onDigit(d: number) {
    if (digits.length >= 4) return;
    const next = [...digits, d];
    setDigits(next);
    setError(false);

    if (next.length === 4) {
      handleComplete(next.join(''));
    }
  }

  function onDelete() {
    setDigits((prev) => prev.slice(0, -1));
    setError(false);
  }

  async function handleComplete(entered: string) {
    if (!firstPin) {
      setFirstPin(entered);
      setDigits([]);
      setStatus('Confirm your PIN');
    } else if (firstPin === entered) {
      await setPin(entered);
      await completeOnboarding();
      router.replace('/home');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFirstPin(null);
      setDigits([]);
      setStatus("PINs didn't match. Try again.");
      setError(true);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={[styles.status, error && { color: Colors.danger }]}>{status}</Text>

      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.dot, i < digits.length && styles.dotFilled]}
          />
        ))}
      </View>

      <View style={styles.pad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <TouchableOpacity key={d} style={styles.key} onPress={() => onDigit(d)}>
            <Text style={styles.keyText}>{d}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.key} />
        <TouchableOpacity style={styles.key} onPress={() => onDigit(0)}>
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.key} onPress={onDelete}>
          <Text style={styles.keyText}>⌫</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card },
  icon: { fontSize: 48, marginBottom: 16 },
  status: { fontSize: 18, fontWeight: '600', marginBottom: 32, color: Colors.text },
  dots: { flexDirection: 'row', marginBottom: 48 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.primary, marginHorizontal: 8 },
  dotFilled: { backgroundColor: Colors.primary },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, justifyContent: 'center' },
  key: { width: 72, height: 56, justifyContent: 'center', alignItems: 'center', margin: 4 },
  keyText: { fontSize: 24, color: Colors.text },
});
