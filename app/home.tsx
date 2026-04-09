import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors } from '../src/constants/theme';

const guards = [
  { icon: '🔍', label: 'Grooming Detection', color: Colors.danger },
  { icon: '👊', label: 'Bullying Detection', color: Colors.warning },
  { icon: '💜', label: 'Self-Harm Signals', color: Colors.purple },
  { icon: '⚠️', label: 'Violence Detection', color: Colors.deepOrange },
  { icon: '💭', label: 'Content Wellness', color: '#D946EF' },
  { icon: '🔞', label: 'Adult Content Blocker', color: '#DC2626' },
  { icon: '📷', label: 'Photo Monitoring', color: Colors.primary },
];

export default function HomeScreen() {
  const { monitoringActive, toggleMonitoring, alerts, unreviewedCount } = useGuard();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.title}>GuardLayer</Text>
        <TouchableOpacity style={styles.dashButton} onPress={() => router.push('/dashboard')}>
          <Text style={styles.dashIcon}>📊</Text>
          {unreviewedCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreviewedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Status card */}
      <View style={[styles.statusCard, monitoringActive && styles.statusCardActive]}>
        <Text style={styles.statusIcon}>{monitoringActive ? '✅' : '⏸️'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>
            {monitoringActive ? 'Protection Active' : 'Protection Paused'}
          </Text>
          <Text style={styles.statusSub}>
            {monitoringActive ? 'Monitoring chats for threats' : 'Turn on monitoring to start'}
          </Text>
        </View>
      </View>

      {/* Toggle */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.cardIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Chat Monitoring</Text>
            <Text style={styles.cardSub}>{monitoringActive ? 'Active' : 'Paused'}</Text>
          </View>
          <Switch value={monitoringActive} onValueChange={toggleMonitoring} />
        </View>
      </View>

      {/* Guard categories */}
      <View style={styles.card}>
        {guards.map((g, i) => (
          <View key={i}>
            <View style={styles.row}>
              <Text style={styles.cardIcon}>{g.icon}</Text>
              <Text style={[styles.cardTitle, { flex: 1 }]}>{g.label}</Text>
              <Text style={{ color: monitoringActive ? Colors.safe : Colors.textLight }}>
                {monitoringActive ? '●' : '○'}
              </Text>
            </View>
            {i < guards.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* Content Radar */}
      <TouchableOpacity style={styles.card} onPress={() => router.push('/content-radar')}>
        <View style={styles.row}>
          <Text style={styles.cardIcon}>📡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Content Radar</Text>
            <Text style={styles.cardSub}>Check games, shows, YouTube, TikTok</Text>
          </View>
          <Text style={{ color: Colors.textLight }}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Alerts summary */}
      {alerts.length > 0 && (
        <TouchableOpacity style={styles.card} onPress={() => router.push('/dashboard')}>
          <View style={styles.row}>
            <Text style={styles.cardIcon}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{alerts.length} alert(s) logged</Text>
              <Text style={[styles.cardSub, unreviewedCount > 0 && { color: Colors.danger }]}>
                {unreviewedCount} unreviewed
              </Text>
            </View>
            <Text style={{ color: Colors.textLight }}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Parent Guide */}
      <TouchableOpacity style={styles.card} onPress={() => router.push('/parent-guide?category=grooming')}>
        <View style={styles.row}>
          <Text style={styles.cardIcon}>📖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Parent Guide</Text>
            <Text style={styles.cardSub}>How to talk to your child about threats</Text>
          </View>
          <Text style={{ color: Colors.textLight }}>›</Text>
        </View>
      </TouchableOpacity>

      {/* School Dashboard (B2B) */}
      <TouchableOpacity style={styles.card} onPress={() => router.push('/school-dashboard')}>
        <View style={styles.row}>
          <Text style={styles.cardIcon}>🏫</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>School Dashboard</Text>
            <Text style={styles.cardSub}>Aggregate safety metrics (demo)</Text>
          </View>
          <Text style={{ color: Colors.textLight }}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Test button */}
      <TouchableOpacity style={styles.testButton} onPress={() => router.push('/test')}>
        <Text style={styles.testButtonText}>🧪 Test Detection</Text>
      </TouchableOpacity>

    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text },
  dashButton: { position: 'relative', padding: 8 },
  dashIcon: { fontSize: 24 },
  badge: { position: 'absolute', top: 2, right: 2, backgroundColor: Colors.danger, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: 'bold' },
  statusCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statusCardActive: { backgroundColor: Colors.safe + '15' },
  statusIcon: { fontSize: 40, marginRight: 16 },
  statusTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  statusSub: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  cardIcon: { fontSize: 24, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '500', color: Colors.text },
  cardSub: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 4 },
  testButton: { borderWidth: 1, borderColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  testButtonText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
});
