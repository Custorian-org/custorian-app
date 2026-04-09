import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, Linking } from 'react-native';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors } from '../src/constants/theme';
import { RiskAlert, ThreatCategory } from '../src/engine/riskEngine';
import { promptReport } from '../src/engine/platformReporter';

const categoryIcons: Record<ThreatCategory, string> = {
  grooming: '🔍',
  bullying: '👊',
  selfHarm: '💜',
  violence: '⚠️',
  contentWellness: '💭',
};

const categoryLabels: Record<ThreatCategory, string> = {
  grooming: 'Grooming Risk',
  bullying: 'Bullying Detected',
  selfHarm: 'Self-Harm Signal',
  violence: 'Violence Concern',
  contentWellness: 'Content Alert',
};

const categoryColors: Record<ThreatCategory, string> = {
  grooming: Colors.danger,
  bullying: Colors.warning,
  selfHarm: Colors.purple,
  violence: Colors.deepOrange,
  contentWellness: '#D946EF',
};

export default function DashboardScreen() {
  const { alerts, clearAlerts, markReviewed, verifyPin, pin } = useGuard();
  const [unlocked, setUnlocked] = useState(!pin);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  if (!unlocked) {
    return (
      <View style={styles.pinContainer}>
        <Text style={styles.pinIcon}>🔒</Text>
        <Text style={[styles.pinTitle, pinError && { color: Colors.danger }]}>
          {pinError ? 'Wrong PIN. Try again.' : 'Enter parent PIN'}
        </Text>
        <View style={styles.pinDots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.pinDot, i < pinInput.length && styles.pinDotFilled]} />
          ))}
        </View>
        <View style={styles.pinPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, -1, 0, -2].map((d) => {
            if (d === -1) return <View key="empty" style={styles.pinKey} />;
            if (d === -2)
              return (
                <TouchableOpacity key="del" style={styles.pinKey} onPress={() => { setPinInput((p) => p.slice(0, -1)); setPinError(false); }}>
                  <Text style={styles.pinKeyText}>⌫</Text>
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
      </View>
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
      <TouchableOpacity style={styles.alertCard} onPress={() => markReviewed(item.id)}>
        <Text style={styles.alertIcon}>{categoryIcons[item.category]}</Text>
        <View style={{ flex: 1 }}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>{categoryLabels[item.category]}</Text>
            {!item.reviewed && (
              <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
            )}
          </View>
          <Text style={styles.alertSnippet} numberOfLines={2}>{item.snippet}</Text>
          <View style={styles.alertMeta}>
            <Text style={styles.alertTime}>{formatTime(item.timestamp)}</Text>
            <View style={[styles.scoreBadge, { backgroundColor: color + '20', borderColor: color }]}>
              <Text style={[styles.scoreText, { color }]}>
                {item.score >= 80 ? 'HIGH' : item.score >= 60 ? 'MED' : 'LOW'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => promptReport(item, (url) => Linking.openURL(url))}
          >
            <Text style={styles.reportText}>🚩 Report to Platform</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {alerts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyText}>All clear — no threats detected.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={alerts}
            keyExtractor={(a) => a.id}
            renderItem={renderAlert}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={{ padding: 16 }}
          />
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => Alert.alert('Clear all alerts?', 'This cannot be undone.', [
              { text: 'Cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearAlerts },
            ])}
          >
            <Text style={styles.clearText}>Clear All Alerts</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  alertCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  alertIcon: { fontSize: 28, marginRight: 12, marginTop: 4 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  alertTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
  newBadge: { backgroundColor: Colors.danger, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  newBadgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  alertSnippet: { fontSize: 13, color: Colors.textLight, lineHeight: 18, marginBottom: 6 },
  alertMeta: { flexDirection: 'row', alignItems: 'center' },
  alertTime: { fontSize: 11, color: Colors.textLight },
  scoreBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  scoreText: { fontSize: 10, fontWeight: 'bold' },
  clearButton: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderColor: '#eee' },
  clearText: { color: Colors.danger, fontWeight: '600' },
  reportButton: { marginTop: 8, backgroundColor: '#FEF3C7', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'flex-start' },
  reportText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  // PIN screen
  pinContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white },
  pinIcon: { fontSize: 48, marginBottom: 16 },
  pinTitle: { fontSize: 18, fontWeight: '600', marginBottom: 32, color: Colors.text },
  pinDots: { flexDirection: 'row', marginBottom: 48 },
  pinDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.primary, marginHorizontal: 8 },
  pinDotFilled: { backgroundColor: Colors.primary },
  pinPad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, justifyContent: 'center' },
  pinKey: { width: 72, height: 56, justifyContent: 'center', alignItems: 'center', margin: 4 },
  pinKeyText: { fontSize: 24, color: Colors.text },
});
