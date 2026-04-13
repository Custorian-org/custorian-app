import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../constants/theme';

/**
 * CautionNudge — a gentle, child-facing notification for borderline content.
 *
 * Unlike InterventionModal (which alerts parents for serious threats),
 * CautionNudge is a soft reminder shown ONLY to the child. It doesn't
 * alert parents, doesn't create a formal alert, and doesn't block anything.
 *
 * Used for:
 * - Crypto/gambling content
 * - Alcohol/substance references that aren't dangerous
 * - Scam patterns
 * - Age-inappropriate but not harmful content
 * - Conspiracy content
 * - Risky online behaviour (sharing personal info, etc.)
 *
 * Philosophy: kids should be kids, but they should also develop good judgment.
 * This nudge teaches critical thinking, not fear.
 */

export type NudgeCategory =
  | 'financial_scam'
  | 'gambling'
  | 'alcohol'
  | 'personal_info'
  | 'suspicious_link'
  | 'age_inappropriate'
  | 'misinformation'
  | 'risky_contact';

interface NudgeConfig {
  icon: string;
  headline: string;
  body: string;
  tips: string[];
  learnMore?: { label: string; url: string };
}

const NUDGES: Record<NudgeCategory, NudgeConfig> = {
  financial_scam: {
    icon: '💰',
    headline: 'This looks like it could be a scam',
    body: "Promises of easy money, free gift cards, or crypto profits are almost always scams. Even smart people fall for them — that's how they're designed.",
    tips: [
      'If it sounds too good to be true, it is',
      'Never send money, gift cards, or crypto to someone online',
      'Real companies never ask for payment via gift cards',
      "Don't click links from people you don't know in real life",
    ],
    learnMore: { label: 'How to spot scams', url: 'https://www.europol.europa.eu/operations-services-and-innovation/public-awareness-and-prevention-guides/online-scams' },
  },

  gambling: {
    icon: '🎰',
    headline: 'Heads up — this involves gambling',
    body: "Gambling sites and crypto betting are designed to make you think you'll win. But statistically, you won't. The house always wins — that's literally how the business works.",
    tips: [
      "Gambling is addictive — it's designed to hook you",
      "CS:GO skins, Robux bets, and crypto are all gambling",
      "You can't 'get good' at gambling — it's random",
      'If you or a friend are spending real money on bets, talk to an adult',
    ],
    learnMore: { label: 'Understanding gambling risks', url: 'https://www.begambleaware.org/for-young-people' },
  },

  alcohol: {
    icon: '🍺',
    headline: 'Quick check-in',
    body: "Alcohol and substances can seem normal because everyone talks about them. But your brain is still developing until you're 25 — and these things affect young brains differently than adult ones.",
    tips: [
      "You don't have to drink to fit in — despite what it looks like online",
      "Peer pressure is real. It's okay to say no and leave",
      "If you're worried about a friend, tell an adult you trust",
      "Mixing substances is especially dangerous for young bodies",
    ],
    learnMore: { label: 'Facts about alcohol and young people', url: 'https://www.drinkaware.co.uk/advice/underage-drinking' },
  },

  personal_info: {
    icon: '📍',
    headline: "Careful — that's personal info",
    body: "Sharing your real name, school, address, phone number, or location online can be risky. Even if you trust the person — once info is out there, you can't take it back.",
    tips: [
      'Never share your address, school name, or phone number in chats',
      "Don't share your location or check in at specific places",
      'Use a username that doesn\'t reveal your real name or age',
      'If someone pressures you for personal info, that\'s a red flag',
    ],
  },

  suspicious_link: {
    icon: '🔗',
    headline: "Be careful with that link",
    body: "Links from people you don't know (or even people you do know whose accounts may be hacked) can lead to scams, malware, or phishing sites that steal your info.",
    tips: [
      "Don't click links from people you don't know",
      'If a friend sends a weird link, ask them about it first — their account might be hacked',
      'Check the URL carefully — fake sites look almost identical to real ones',
      "When in doubt, don't click",
    ],
  },

  age_inappropriate: {
    icon: '⚡',
    headline: "This content might not be for your age group",
    body: "Not everything online is meant for everyone. Some content is designed for older audiences — not because you can't handle it, but because it's more useful when you have more life experience.",
    tips: [
      "It's okay to skip content that makes you uncomfortable",
      "Ask yourself: does this make me feel good or bad about myself?",
      "Talk to a parent or trusted adult if you see something confusing",
      "You'll have plenty of time for this stuff when you're older",
    ],
  },

  misinformation: {
    icon: '🤔',
    headline: 'Worth fact-checking',
    body: "Not everything online is true — even if lots of people believe it. Learning to question what you read is one of the most important skills you can develop.",
    tips: [
      'Check multiple sources before believing something',
      'Ask: who posted this, and what do they gain from me believing it?',
      'Just because something is popular doesn\'t mean it\'s true',
      'Look for evidence, not just opinions',
    ],
    learnMore: { label: 'How to spot misinformation', url: 'https://www.commonsensemedia.org/articles/how-to-spot-misinformation' },
  },

  risky_contact: {
    icon: '👤',
    headline: 'Do you actually know this person?',
    body: "Online, anyone can pretend to be anyone. If someone you've never met in real life is being very friendly very fast — that's worth paying attention to.",
    tips: [
      "If you haven't met them in person, be cautious about what you share",
      'Adults who want to be your friend online is unusual — trust that instinct',
      "Don't move conversations to more private apps when someone asks",
      'Tell a parent or trusted adult if an online contact makes you feel weird — even a little',
    ],
  },
};

interface Props {
  category: NudgeCategory;
  onDismiss: () => void;
}

export default function CautionNudge({ category, onDismiss }: Props) {
  const config = NUDGES[category];
  const [showTips, setShowTips] = useState(false);

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.headline}>{config.headline}</Text>
        <Text style={styles.body}>{config.body}</Text>

        {/* Collapsible — child can expand/collapse */}
        <TouchableOpacity
          style={styles.expandRow}
          onPress={() => setShowTips(!showTips)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandText}>Why this matters and what you can do</Text>
          <Text style={styles.expandIcon}>{showTips ? '−' : '+'}</Text>
        </TouchableOpacity>

        {showTips && (
          <View style={styles.tipsContainer}>
            {config.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}

            {config.learnMore && (
              <TouchableOpacity
                style={styles.learnMore}
                onPress={() => Linking.openURL(config.learnMore!.url)}
              >
                <Text style={styles.learnMoreText}>{config.learnMore.label} →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.gotIt} onPress={onDismiss}>
          <Text style={styles.gotItText}>Got it</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          This is just a heads-up — not a warning. You're not in trouble.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center',
    alignItems: 'center', padding: 24, zIndex: 999,
  },
  card: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 28,
    maxWidth: 360, width: '100%', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  icon: { fontSize: 48, marginBottom: 12 },
  headline: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: Colors.text, marginBottom: 8 },
  body: { fontSize: 14, textAlign: 'center', color: Colors.textDim, lineHeight: 22, marginBottom: 20 },
  expandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 4 },
  expandText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  expandIcon: { fontSize: 18, color: Colors.primary },
  tipsContainer: { width: '100%', marginBottom: 16 },
  tipRow: { flexDirection: 'row', marginBottom: 8, paddingRight: 8 },
  bullet: { color: Colors.primary, fontSize: 14, marginRight: 8, marginTop: 1 },
  tipText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 19 },
  learnMore: {
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10,
    backgroundColor: Colors.primary + '10', marginBottom: 16, width: '100%', alignItems: 'center',
  },
  learnMoreText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  gotIt: {
    width: '100%', padding: 14, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', marginBottom: 8,
  },
  gotItText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  note: { fontSize: 11, color: Colors.textDim, textAlign: 'center', fontStyle: 'italic' },
});
