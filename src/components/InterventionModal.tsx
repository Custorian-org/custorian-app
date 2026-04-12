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
      '⚠️ What can happen: People who ask for photos can use them to blackmail you. They share them with others. Once a photo is sent, you can never get it back. This happens to thousands of kids — it\'s not your fault, but you can stop it now by not sending anything',
    ],
  },
  bullying: {
    icon: '💙',
    color: Colors.warning,
    headline: "That wasn't okay",
    body: "What someone said was hurtful. You didn't deserve that. No one has the right to talk to you like that.",
    tips: [
      "Don't respond when you're upset — take a break. Responding in anger usually makes it worse",
      "Screenshot it before blocking — it's evidence if you need it later",
      'Tell a parent, teacher, or someone you trust. Not because you\'re weak — because this is what adults are for',
      'Report them on the platform — it matters and it creates a record',
      '⚠️ If you\'re thinking of retaliating: messages and posts are permanent. Schools and future employers can see them. What feels justified now can follow you for years',
    ],
  },
  selfHarm: {
    icon: '💜',
    color: Colors.purple,
    headline: "We noticed you might be going through something hard",
    body: "Whatever you're feeling right now is real and it matters. You don't have to figure this out alone.",
    tips: [
      'You are not alone — even when it feels that way',
      'Think of ONE person you trust — a parent, teacher, older sibling, coach, anyone. Text them right now. Just say "I need to talk"',
      'Write down what you\'re feeling. Getting it out of your head helps, even if no one reads it',
      'If things feel really dark — open the door, go outside, change the room. Small movements break big feelings',
      'This feeling will change. It always does. Even if it doesn\'t feel like it right now',
    ],
    crisis: { label: 'Børnetelefonen (text or chat — you don\'t have to call)', number: '116111' },
  },
  violence: {
    icon: '⏸️',
    color: Colors.deepOrange,
    headline: 'Stop. Read this first.',
    body: "Whatever you're feeling right now is real. But what you do next matters more than what you're feeling.",
    tips: [
      'Walk away from the screen. Right now. 10 minutes. That\'s all',
      "Tell an adult you trust how you're feeling — a parent, teacher, coach, anyone",
      "Write it down if you need to — but don't send it. Sleep on it",
      '⚠️ Consequences are real: Threatening someone online is a criminal offence — even for minors. Police investigate digital threats. Messages are permanent evidence. A moment of anger can result in arrest, expulsion, or a criminal record that follows you into adulthood',
      '⚠️ If someone is threatening YOU: tell an adult immediately. You don\'t have to handle this alone. Screenshot everything',
    ],
  },
  contentWellness: {
    icon: '💭',
    color: '#D946EF',
    headline: "Let's talk about what you're seeing",
    body: "The internet shows us a lot of stuff — some of it can make us feel bad about ourselves or pressure us into things that aren't good for us. That's not your fault.",
    tips: [
      "What you see online isn't real life — most of it is edited, filtered, or fake",
      "Your worth has nothing to do with how you look or how many followers you have",
      "If something makes you feel bad about yourself, that's a signal to stop watching — not a signal that something is wrong with you",
      "Algorithms show you more of what you engage with. If you watch sad content, you get more sad content. You can break the cycle by watching something different",
      "⚠️ Extreme diets, body challenges, and 'transformation' content cause real eating disorders. This isn't about willpower — it's about brain chemistry. If you find yourself obsessing about food or your body, talk to an adult",
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

        <View style={styles.anonymousNote}>
          <Text style={styles.anonymousText}>
            🔒 Everything in this app is private. If you report something, it's completely anonymous — it will never come back to you. No one will know you reported it. Not the person, not your school, not anyone.
          </Text>
        </View>

        {config.crisis && (
          <View style={[styles.crisisCard, { backgroundColor: Colors.purple + '15' }]}>
            <Text style={styles.crisisTitle}>
              If you need to talk to someone right now:
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${config.crisis!.number}`)}>
              <Text style={styles.crisisNumber}>
                📞 {config.crisis.label}: {config.crisis.number}
              </Text>
            </TouchableOpacity>
            <Text style={styles.crisisSubtext}>You can call, text, or chat online — whatever feels easiest. It's free, anonymous, and they've heard it all before. You won't shock them.</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.button, { backgroundColor: config.color }]} onPress={onDismiss}>
          <Text style={styles.buttonText}>Think of one person you trust. Tell them.</Text>
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
  anonymousNote: { width: '100%', padding: 16, backgroundColor: Colors.safe + '10', borderRadius: 12, marginBottom: 16 },
  anonymousText: { fontSize: 12, color: Colors.text, lineHeight: 18, textAlign: 'center' },
});
