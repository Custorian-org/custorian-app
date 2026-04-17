import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/constants/theme';
import { analyzeMessage, CoachResponse } from '../src/engine/safetyCoach';
import { logScanEvent, logIntervention } from '../src/lib/analytics';
import { syncAlertToFamily } from '../src/engine/familySync';
import { createAlert } from '../src/engine/riskEngine';

const riskColors = { safe: '#10b981', caution: '#f59e0b', danger: '#ef4444' };
const riskIcons = { safe: '✅', caution: '⚠️', danger: '🚨' };
const riskTitles = { safe: 'This looks safe', caution: 'Be careful', danger: 'This is not okay' };

export default function SafetyCoachScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [input, setInput] = useState((params.sharedText as string) || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoachResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function analyze() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    const response = await analyzeMessage(input.trim());
    setResult(response);
    setLoading(false);

    // Log that the child used the safety coach (anonymous — no message content)
    if (response) {
      logScanEvent({
        category: response.risk === 'danger' ? 'grooming' : 'contentWellness',
        severity: response.risk === 'danger' ? 'high' : response.risk === 'caution' ? 'medium' : 'low',
        confidence: response.risk === 'danger' ? 0.8 : 0.5,
        language: 'auto',
        source: 'safety_coach',
      }).catch(() => {});

      logIntervention({
        category: response.risk === 'danger' ? 'grooming' : 'contentWellness',
        intervention_type: 'safety_coach',
      }).catch(() => {});

      // If dangerous, notify parent (but NOT the message — just that the child used the coach)
      if (response.shouldTellParent && response.risk === 'danger') {
        const alert = createAlert(
          'grooming', 80,
          'Child used Safety Coach for a concerning message',
          'Safety Coach'
        );
        syncAlertToFamily(alert).catch(() => {});
      }
    }
  }

  function copyResponse(text: string) {
    Clipboard.setString(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={s.header}>
          <View style={s.iconCircle}>
            <Text style={{ fontSize: 24, color: '#fff', fontWeight: '800' }}>C</Text>
          </View>
          <Text style={s.title}>Safety Coach</Text>
          <Text style={s.subtitle}>Paste what someone said to you and I'll help you figure out what to do.</Text>
        </View>

        {/* Input */}
        <TextInput
          style={s.input}
          placeholder="Paste the message here..."
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity style={s.analyzeBtn} onPress={analyze} disabled={loading || !input.trim()}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.analyzeBtnText}>Is this safe?</Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View style={s.resultContainer}>
            {/* Risk level */}
            <View style={[s.riskBanner, { backgroundColor: riskColors[result.risk] + '15', borderColor: riskColors[result.risk] + '30' }]}>
              <Text style={{ fontSize: 28, marginBottom: 4 }}>{riskIcons[result.risk]}</Text>
              <Text style={[s.riskTitle, { color: riskColors[result.risk] }]}>{riskTitles[result.risk]}</Text>
              <Text style={s.riskDesc}>{result.whatIsHappening}</Text>
            </View>

            {/* What to do */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>What to do right now</Text>
              {result.whatToDo.map((action, i) => (
                <View key={i} style={s.actionRow}>
                  <View style={[s.actionNum, { backgroundColor: riskColors[result.risk] + '20' }]}>
                    <Text style={[s.actionNumText, { color: riskColors[result.risk] }]}>{i + 1}</Text>
                  </View>
                  <Text style={s.actionText}>{action}</Text>
                </View>
              ))}
            </View>

            {/* Suggested responses */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>You can say</Text>
              <Text style={s.sectionHint}>Tap to copy, then paste in your chat</Text>
              {result.suggestedResponses.map((resp, i) => (
                <TouchableOpacity key={i} style={s.responseCard} onPress={() => copyResponse(resp)} activeOpacity={0.7}>
                  <Text style={s.responseText}>"{resp}"</Text>
                  <Text style={s.copyHint}>{copied === resp ? '✓ Copied!' : 'Tap to copy'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tell parent option */}
            {result.shouldTellParent && (
              <TouchableOpacity
                style={s.tellParent}
                onPress={() => {
                  const alert = createAlert('grooming', 70, 'Child requested parent support via Safety Coach', 'Safety Coach');
                  syncAlertToFamily(alert).catch(() => {});
                  Alert.alert(
                    'Your parent has been notified',
                    'They know you asked for help — but they can\'t see what was said. You\'re not in trouble. You did the right thing.',
                  );
                }}
              >
                <Text style={s.tellParentText}>Tell my parent I need help</Text>
                <Text style={s.tellParentHint}>They'll know you reached out — but they won't see the message</Text>
              </TouchableOpacity>
            )}

            {/* Encouragement */}
            <View style={s.encouragement}>
              <Text style={s.encouragementText}>{result.encouragement}</Text>
            </View>
          </View>
        )}

        {/* Privacy note */}
        <Text style={s.privacy}>Your messages are analyzed by AI and never stored. No one can see what you pasted here — not your parents, not us.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8FF' },
  scroll: { padding: 20, paddingBottom: 60 },
  back: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginBottom: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#2d2b55', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#7c7a9a', textAlign: 'center', marginTop: 4, lineHeight: 18, maxWidth: 280 },
  input: { backgroundColor: '#f5f3ff', borderWidth: 1, borderColor: '#eae8f0', borderRadius: 20, padding: 16, fontSize: 15, minHeight: 100, color: '#2d2b55', marginBottom: 12, lineHeight: 22 },
  analyzeBtn: { backgroundColor: '#7c3aed', borderRadius: 100, padding: 16, alignItems: 'center', marginBottom: 24 },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultContainer: { marginBottom: 24 },
  riskBanner: { borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, marginBottom: 20 },
  riskTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  riskDesc: { fontSize: 13, color: '#4b5563', textAlign: 'center', lineHeight: 19 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2d2b55', marginBottom: 8 },
  sectionHint: { fontSize: 11, color: '#aba9c3', marginBottom: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  actionNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionNumText: { fontSize: 12, fontWeight: '800' },
  actionText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
  responseCard: { backgroundColor: '#f5f3ff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#ede9fe' },
  responseText: { fontSize: 14, color: '#4c1d95', fontWeight: '500', lineHeight: 20 },
  copyHint: { fontSize: 10, color: '#a78bfa', marginTop: 4, fontWeight: '600' },
  tellParent: { backgroundColor: '#fef2f2', borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca', marginBottom: 16 },
  tellParentText: { fontSize: 14, fontWeight: '700', color: '#dc2626', marginBottom: 4 },
  tellParentHint: { fontSize: 11, color: '#991b1b' },
  encouragement: { backgroundColor: '#f0fdf4', borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  encouragementText: { fontSize: 13, color: '#166534', textAlign: 'center', lineHeight: 19, fontWeight: '500' },
  privacy: { fontSize: 10, color: '#aba9c3', textAlign: 'center', lineHeight: 15, marginTop: 16 },
});
