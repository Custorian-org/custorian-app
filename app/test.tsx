import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors } from '../src/constants/theme';
import InterventionModal from '../src/components/InterventionModal';
import { ThreatCategory } from '../src/engine/riskEngine';

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
  const { processMessage } = useGuard();

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
