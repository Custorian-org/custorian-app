import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors } from '../src/constants/theme';
import InterventionModal from '../src/components/InterventionModal';
import { ThreatCategory } from '../src/engine/riskEngine';
import { getAnalytics } from '../src/engine/analytics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const samples: [string, string][] = [
  ['Grooming: flattery + secrecy', "You're so pretty for your age. Don't tell your parents about us, this is our secret ok?"],
  ['Grooming: photo request', 'Hey can you send me a selfie? What are you wearing right now?'],
  ['Grooming: meetup', "I'm near your school, want to meet up? I can pick you up"],
  ['Bullying: insults', "You're ugly and stupid. Everyone hates you, nobody likes you."],
  ['Bullying: threats', "I'll beat you up after school. Watch your back, you're dead."],
  ['Self-harm: crisis', "I don't want to be alive anymore. Nobody would even notice if I disappeared."],
  ['Self-harm: method', "I've been looking up how to do it painlessly. I can't take this anymore."],
  ['Violence: threat', "I'm bringing a knife to school tomorrow. They'll all pay for what they did."],
  ['Violence: planning', "I'm planning to attack after school on Friday. Nobody will stop me."],
  ['Danish: grooming', "Du er så smuk. Sig det ikke til dine forældre, det er vores hemmelighed."],
  ['Danish: bullying', "Du er grim og dum. Alle hader dig, du har ingen venner."],
  ['Danish: self-harm', "Jeg vil ikke leve mere. Ingen ville savne mig."],
  ['Body image', "I'm so fat and ugly. Why can't I look like her? I need to lose weight, I'm fasting for 3 days."],
  ['Harmful trend', "Have you tried the blackout challenge? Someone dared me to do the choking game"],
  ['Adult content', "Anyone got a link to bypass the age verification? Looking for nsfw content"],
  ['Danish: body image', "Jeg er så fed og grim. Jeg hader min krop. Jeg skal tabe mig."],
  ['Safe message', 'Hey want to play Roblox later? I found a cool new game!'],
];

const categoryColors: Record<ThreatCategory, string> = {
  grooming: Colors.danger,
  bullying: Colors.warning,
  selfHarm: Colors.purple,
  violence: Colors.deepOrange,
  contentWellness: '#D946EF',
};

const categoryLabels: Record<ThreatCategory, string> = {
  grooming: 'GROOMING DETECTED',
  bullying: 'BULLYING DETECTED',
  selfHarm: 'SELF-HARM SIGNAL',
  violence: 'VIOLENCE CONCERN',
  contentWellness: 'CONTENT ALERT',
};

export default function TestScreen() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [resultColor, setResultColor] = useState(Colors.safe);
  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionCategory, setInterventionCategory] = useState<ThreatCategory>('grooming');
  const [analyticsData, setAnalyticsData] = useState<string>('');
  const { processMessage, runDemo } = useGuard();

  function analyze(text: string) {
    const alert = processMessage(text, 'Test Mode');
    if (alert) {
      setResult(`${categoryLabels[alert.category]} — Score: ${alert.score}/100`);
      setResultColor(categoryColors[alert.category]);
      setInterventionCategory(alert.category);
      setShowIntervention(true);
    } else {
      setResult('No threat detected — Safe');
      setResultColor(Colors.safe);
    }
  }

  return (
    <View style={styles.container}>
      {/* Demo mode button */}
      <TouchableOpacity
        style={{ backgroundColor: Colors.primary + '15', borderRadius: 12, padding: 14, marginHorizontal: 16, marginTop: 12, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '30' }}
        onPress={() => { runDemo(); setResult('Demo running — 5 alerts generating...'); setResultColor(Colors.primary); }}
      >
        <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 14 }}>Run Full Demo</Text>
        <Text style={{ color: Colors.primary + '80', fontSize: 11, marginTop: 2 }}>Simulates 5 threats across different apps and categories</Text>
      </TouchableOpacity>

      {/* Debug analytics (Chamath) */}
      <TouchableOpacity
        style={{ marginHorizontal: 16, marginBottom: 8, padding: 10, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' }}
        onPress={async () => { const data = await getAnalytics(); setAnalyticsData(JSON.stringify(data, null, 2)); }}
      >
        <Text style={{ fontSize: 11, color: '#6b7280' }}>View Local Analytics</Text>
      </TouchableOpacity>

      {/* PhotoDNA Test */}
      <TouchableOpacity
        style={{ marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12, backgroundColor: '#7c3aed15', alignItems: 'center', borderWidth: 1, borderColor: '#7c3aed30' }}
        onPress={async () => {
          try {
            const pickerResult = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              base64: false,
            });
            if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) return;

            setResult('PhotoDNA: Scanning...');
            setResultColor('#7c3aed');

            const uri = pickerResult.assets[0].uri;
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            const key = process.env.PHOTODNA_API_KEY;
            const endpoint = process.env.PHOTODNA_ENDPOINT || 'https://api.microsoftmoderator.com/photodna/v1.0/Match';

            if (!key) { setResult('PhotoDNA: No API key in .env'); setResultColor(Colors.danger); return; }

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key': key },
              body: JSON.stringify({ DataRepresentation: 'inline', Value: base64 }),
            });

            const status = response.status;
            const data = await response.json();

            if (status === 200 && data.IsMatch === true) {
              setResult('PhotoDNA: CSAM MATCH — MANDATORY REPORT');
              setResultColor(Colors.danger);
            } else if (status === 200) {
              setResult(`PhotoDNA: No match. API working. (Status: ${data.Status?.Code || 'OK'})`);
              setResultColor(Colors.safe);
            } else {
              setResult(`PhotoDNA: API error ${status} — ${data.Message || JSON.stringify(data).substring(0, 100)}`);
              setResultColor(Colors.warning);
            }

            setAnalyticsData(JSON.stringify({ status, ...data }, null, 2));
          } catch (e: any) {
            setResult(`PhotoDNA: ${e.message}`);
            setResultColor(Colors.danger);
          }
        }}
      >
        <Text style={{ color: '#7c3aed', fontWeight: '700', fontSize: 14 }}>Test PhotoDNA</Text>
        <Text style={{ color: '#7c3aed80', fontSize: 11, marginTop: 2 }}>Pick any photo — checks hash against Microsoft CSAM database</Text>
      </TouchableOpacity>
      {analyticsData ? <Text style={{ fontSize: 9, color: '#9ca3af', paddingHorizontal: 16, marginBottom: 8, fontFamily: 'monospace' }}>{analyticsData}</Text> : null}

      {result && (
        <View style={[styles.resultBanner, { backgroundColor: resultColor + '20', borderColor: resultColor }]}>
          <Text style={[styles.resultText, { color: resultColor }]}>{result}</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message to test..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => { if (input.trim()) { analyze(input); setInput(''); } }}
        >
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Sample messages:</Text>

      <FlatList
        data={samples}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item: [label, message] }) => (
          <TouchableOpacity style={styles.sampleCard} onPress={() => analyze(message)}>
            <Text style={styles.sampleLabel}>{label}</Text>
            <Text style={styles.sampleText} numberOfLines={2}>{message}</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <Modal visible={showIntervention} animationType="slide">
        <InterventionModal
          category={interventionCategory}
          onDismiss={() => setShowIntervention(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: 16 },
  resultBanner: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16, alignItems: 'center' },
  resultText: { fontSize: 16, fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, fontSize: 15, backgroundColor: Colors.card, maxHeight: 80 },
  sendButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendText: { color: Colors.white, fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textDim, marginBottom: 8 },
  sampleCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  sampleLabel: { fontSize: 12, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  sampleText: { fontSize: 13, color: Colors.textDim },
});
