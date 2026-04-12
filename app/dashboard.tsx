import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors, Spacing, Radius } from '../src/constants/theme';
import { RiskAlert, ThreatCategory } from '../src/engine/riskEngine';
import { promptReport } from '../src/engine/platformReporter';

const categoryLabels: Record<ThreatCategory, string> = {
  grooming: 'Grooming Risk',
  bullying: 'Bullying Detected',
  selfHarm: 'Self-Harm Signal',
  violence: 'Violence Concern',
  contentWellness: 'Content Alert',
};

const categoryColors: Record<ThreatCategory, string> = {
  grooming: Colors.grooming,
  bullying: Colors.bullying,
  selfHarm: Colors.selfHarm,
  violence: Colors.violence,
  contentWellness: Colors.wellness,
};

export default function DashboardScreen() {
  const router = useRouter();
  const { alerts, clearAlerts, markReviewed, verifyPin, pin } = useGuard();
  const [unlocked, setUnlocked] = useState(!pin);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // PIN Screen
  if (!unlocked) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.pinContainer}>
          <View style={styles.pinLock}>
            <View style={styles.pinLockCircle}>
              <Text style={styles.pinLockIcon}>⬡</Text>
            </View>
          </View>
          <Text style={[styles.pinTitle, pinError && { color: Colors.danger }]}>
            {pinError ? 'Incorrect PIN' : 'Enter parent PIN'}
          </Text>
          <Text style={styles.pinSubtitle}>4-digit PIN required to view alerts</Text>

          {/* PIN dots */}
          <View style={styles.pinDots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.pinDot, i < pinInput.length && styles.pinDotFilled]} />
            ))}
          </View>

          {/* Number pad */}
          <View style={styles.pinPad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, -1, 0, -2].map((d) => {
              if (d === -1) return <View key="empty" style={styles.pinKey} />;
              if (d === -2)
                return (
                  <TouchableOpacity key="del" style={styles.pinKey} onPress={() => { setPinInput((p) => p.slice(0, -1)); setPinError(false); }}>
                    <Text style={styles.pinKeyText}>←</Text>
                  </TouchableOpacity>
                );
              return (
                <TouchableOpacity
                  key={d}
                  style={styles.pinKey}
                  onPress={() => {
                    const next = pinInput + d;
                    setPinInput(next);
                    setPinError(false);
                    if (next.length === 4) {
                      if (verifyPin(next)) {
                        setUnlocked(true);
                      } else {
                        setPinInput('');
                        setPinError(true);
                      }
                    }
                  }}
                >
                  <Text style={styles.pinKeyText}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.xl }}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function formatTime(ts: string) {
    const d = new Date(ts);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  function renderAlert({ item }: { item: RiskAlert }) {
    const color = categoryColors[item.category];
    return (
      <TouchableOpacity style={styles.alertCard} onPress={() => markReviewed(item.id)} activeOpacity={0.7}>
        <View style={[styles.alertStripe, { backgroundColor: color }]} />
        <View style={styles.alertBody}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>{categoryLabels[item.category]}</Text>
            {!item.reviewed && (
              <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
            )}
          </View>
          <Text style={styles.alertSnippet} numberOfLines={2}>{item.snippet}</Text>
          <View style={styles.alertMeta}>
            <Text style={styles.alertTime}>{formatTime(item.timestamp)}</Text>
            <View style={[styles.scoreBadge, { backgroundColor: color + '15', borderColor: color + '30' }]}>
              <Text style={[styles.scoreText, { color }]}>
                {item.score >= 80 ? 'HIGH' : item.score >= 60 ? 'MED' : 'LOW'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => promptReport(item, (url) => Linking.openURL(url))}
          >
            <Text style={styles.reportText}>Report to platform →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Parent Dashboard</Text>
        <Text style={styles.subtitle}>{alerts.length} alert{alerts.length !== 1 ? 's' : ''} logged</Text>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>All clear</Text>
          <Text style={styles.emptyText}>No threats detected. Protection is running.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={alerts}
            keyExtractor={(a) => a.id}
            renderItem={renderAlert}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={{ padding: Spacing.lg }}
          />
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => Alert.alert('Clear all alerts?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearAlerts },
            ])}
          >
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  backBtn: { fontSize: 14, color: Colors.accent, marginBottom: Spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.textMute, marginTop: 4 },

  // Empty
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textDim, marginTop: 4 },

  // Alert cards
  alertCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  alertStripe: { width: 4 },
  alertBody: { flex: 1, padding: Spacing.lg },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  newBadge: { backgroundColor: Colors.danger, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  newBadgeText: { color: Colors.text, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  alertSnippet: { fontSize: 13, color: Colors.textDim, lineHeight: 18, marginBottom: 8 },
  alertMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertTime: { fontSize: 11, color: Colors.textMute },
  scoreBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  scoreText: { fontSize: 10, fontWeight: '700' },
  reportButton: { marginTop: 10, backgroundColor: Colors.accent + '10', borderRadius: Radius.sm, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' },
  reportText: { fontSize: 12, fontWeight: '600', color: Colors.accent },

  // Clear
  clearButton: { padding: Spacing.lg, alignItems: 'center', borderTopWidth: 1, borderColor: Colors.border },
  clearText: { color: Colors.danger, fontWeight: '600', fontSize: 14 },

  // PIN screen
  pinContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  pinLock: { marginBottom: Spacing.xl },
  pinLockCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  pinLockIcon: { fontSize: 28, color: Colors.accent },
  pinTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  pinSubtitle: { fontSize: 13, color: Colors.textMute, marginBottom: Spacing.xl },
  pinDots: { flexDirection: 'row', marginBottom: Spacing.xl, gap: 16 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.border, backgroundColor: 'transparent' },
  pinDotFilled: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pinPad: { flexDirection: 'row', flexWrap: 'wrap', width: 264, justifyContent: 'center' },
  pinKey: { width: 80, height: 60, justifyContent: 'center', alignItems: 'center', margin: 4, borderRadius: Radius.md, backgroundColor: Colors.card },
  pinKeyText: { fontSize: 24, fontWeight: '500', color: Colors.text },
  backLink: { fontSize: 14, color: Colors.accent },
});
