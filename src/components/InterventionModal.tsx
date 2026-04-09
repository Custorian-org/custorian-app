import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Colors } from '../constants/theme';
import { ThreatCategory } from '../engine/riskEngine';

interface Props {
  category: ThreatCategory;
  onDismiss: () => void;
}

const configs: Record<ThreatCategory, {
  icon: string;
  color: string;
  headline: string;
  body: string;
  tips: string[];
  crisis?: { label: string; number: string };
}> = {
  grooming: {
    icon: '🛡️',
    color: Colors.primary,
    headline: 'Hey — this person seems pushy',
    body: "Sometimes people online try to rush things or ask for stuff that feels weird. That's not your fault — and you don't have to answer.",
    tips: [
      'You never have to share photos or personal info',
      "Real friends don't ask you to keep secrets from your family",
      "It's always okay to stop chatting if something feels off",
      'Block and report anyone who makes you uncomfortable',
    ],
  },
  bullying: {
    icon: '💙',
    color: Colors.warning,
    headline: "That wasn't okay",
    body: "What someone said was hurtful. You didn't deserve that. No one has the right to talk to you like that.",
    tips: [
      "Don't respond when you're upset — take a break",
      "Screenshot it before blocking (it's evidence)",
      'Talk to someone you trust about what happened',
      'Report them on the platform — it matters',
    ],
  },
  selfHarm: {
    icon: '💜',
    color: Colors.purple,
    headline: "We noticed you might be going through something hard",
    body: "Whatever you're feeling right now is real and it matters. But there are people who can help — and things can get better.",
    tips: [
      'You are not alone — even when it feels that way',
      'Talking to someone helps, even if it\'s scary',
      'Call Børnetelefonen 116 111 — they listen, no judgment',
      'You matter more than you know right now',
    ],
    crisis: { label: 'Børnetelefonen', number: '116111' },
  },
  violence: {
    icon: '⏸️',
    color: Colors.deepOrange,
    headline: 'Take a moment',
    body: "When we're angry, it can feel like nothing else matters. But actions have consequences that can't be undone. Talk to someone before doing anything.",
    tips: [
      'Walk away from the screen for 10 minutes',
      "Tell an adult you trust how you're feeling",
      "Writing it down can help — but don't send it",
      'Things feel different after you cool down',
    ],
  },
  contentWellness: {
    icon: '💭',
    color: '#D946EF',
    headline: "Let's talk about what you're seeing",
    body: "The internet shows us a lot of stuff — some of it can make us feel bad about ourselves or pressure us into things that aren't good for us. That's not your fault.",
    tips: [
      "What you see online isn't real life — most of it is edited or fake",
      "Your worth has nothing to do with how you look",
      "If something makes you feel bad, it's okay to stop watching",
      "Talk to someone you trust about what you've been seeing",
      "You get to choose what you spend your time on",
    ],
  },
};

export default function InterventionModal({ category, onDismiss }: Props) {
  const config = configs[category];

  return (
    <ScrollView style={[styles.container, { backgroundColor: config.color + '08' }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{config.icon}</Text>
        <Text style={styles.headline}>{config.headline}</Text>
        <Text style={styles.body}>{config.body}</Text>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>What you can do:</Text>
          {config.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {config.crisis && (
          <TouchableOpacity
            style={[styles.crisisCard, { backgroundColor: Colors.purple + '15' }]}
            onPress={() => Linking.openURL(`tel:${config.crisis!.number}`)}
          >
            <Text style={styles.crisisTitle}>
              You're not alone. Talk to someone who cares:
            </Text>
            <Text style={styles.crisisNumber}>
              {config.crisis.label}: {config.crisis.number}
            </Text>
            <Text style={styles.crisisSubtext}>Open 24/7 — call or chat</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.button, { backgroundColor: config.color }]} onPress={onDismiss}>
          <Text style={styles.buttonText}>Talk to a trusted adult</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonOutline} onPress={onDismiss}>
          <Text style={[styles.buttonOutlineText, { color: config.color }]}>
            I understand, go back
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 32, alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: 16 },
  headline: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: Colors.text },
  body: { fontSize: 16, textAlign: 'center', color: Colors.textLight, lineHeight: 24, marginBottom: 24 },
  tipsCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, width: '100%', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tipsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: Colors.text },
  tipRow: { flexDirection: 'row', marginBottom: 8 },
  checkmark: { color: Colors.safe, fontSize: 16, marginRight: 8, marginTop: 2 },
  tipText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  crisisCard: { borderRadius: 16, padding: 20, width: '100%', marginBottom: 20, alignItems: 'center' },
  crisisTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  crisisNumber: { fontSize: 20, fontWeight: 'bold', color: Colors.purple },
  crisisSubtext: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
  button: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  buttonOutline: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  buttonOutlineText: { fontSize: 16, fontWeight: '600' },
});
