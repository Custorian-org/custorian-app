import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../src/constants/theme';
import { ThreatCategory } from '../src/engine/riskEngine';

interface ParentGuidance {
  title: string;
  icon: string;
  whatHappened: string;
  whatItMeans: string;
  howToTalk: string[];
  conversationStarters: string[];
  whatNotToDo: string[];
  resources: { label: string; url?: string; phone?: string }[];
}

const GUIDES: Record<ThreatCategory, ParentGuidance> = {
  grooming: {
    title: 'Grooming Risk Detected',
    icon: '🛡️',
    whatHappened: 'Custorian detected patterns consistent with online grooming — an adult building trust with a child to exploit them. This includes flattery, secrecy requests, photo requests, or meeting proposals.',
    whatItMeans: 'This doesn\'t mean your child did anything wrong. Groomers are skilled manipulators who target children through games and social media. The patterns detected suggest someone may be attempting to build an inappropriate relationship.',
    howToTalk: [
      'Stay calm. Your reaction sets the tone — if you panic, they\'ll stop telling you things.',
      'Don\'t blame them. Say: "I\'m glad I found out. You\'re not in trouble."',
      'Ask open questions: "Can you tell me about this person?"',
      'Explain that adults who ask kids to keep secrets from parents are not safe people.',
      'Reassure them: "Real friends don\'t ask you to hide things from your family."',
      'Let them know this happens to many kids and it\'s never their fault.',
    ],
    conversationStarters: [
      '"I noticed something on your phone that worried me. Can we talk about it?"',
      '"Has anyone online ever made you feel uncomfortable or asked you to keep a secret?"',
      '"If someone online asked you for a photo, what would you do?"',
      '"I want you to know you can always tell me if something feels weird, even if someone told you not to."',
    ],
    whatNotToDo: [
      'Don\'t take their phone away as punishment — they\'ll just hide it better next time',
      'Don\'t confront the suspected groomer directly — report to police',
      'Don\'t read all their messages in front of them — it breaks trust',
      'Don\'t shame them for being "naive" — groomers manipulate adults too',
      'Don\'t assume it can\'t happen to your child — it happens to all demographics',
    ],
    resources: [
      { label: 'Børns Vilkår (DK)', phone: '116111' },
      { label: 'ForældreTelefonen (DK)', phone: '35556565' },
      { label: 'Red Barnet / Save the Children DK', url: 'https://redbarnet.dk' },
      { label: 'Politi (Danish Police) — report', phone: '114' },
      { label: 'NCMEC CyberTipline (international)', url: 'https://report.cybertip.org' },
    ],
  },
  bullying: {
    title: 'Cyberbullying Detected',
    icon: '💙',
    whatHappened: 'Custorian detected messages containing direct insults, threats, social exclusion, or reputation attacks directed at your child — or sent by them.',
    whatItMeans: 'Cyberbullying causes real psychological harm — anxiety, depression, school avoidance. It\'s important to address it early, whether your child is the target or the one bullying.',
    howToTalk: [
      'If they\'re being bullied: "I\'m sorry this is happening. It\'s not okay and it\'s not your fault."',
      'If they\'re bullying: "I saw something that concerned me. Let\'s talk about how words affect people."',
      'Don\'t minimize it: "Just ignore them" doesn\'t work. Acknowledge the pain.',
      'Help them understand the difference between conflict and bullying (repeated, intentional, power imbalance).',
      'Discuss strategy together: block, report, screenshot evidence, tell a teacher.',
    ],
    conversationStarters: [
      '"How are things going with your friends online? Has anyone been mean to you?"',
      '"If someone said [flagged content] to you, how would that make you feel?"',
      '"I want to help, not punish. What do you think we should do about this?"',
    ],
    whatNotToDo: [
      'Don\'t tell them to "just fight back" — escalation makes it worse',
      'Don\'t contact the bully\'s parents directly — go through the school',
      'Don\'t post about it on social media — it amplifies the situation',
      'Don\'t dismiss it as "kids being kids" — cyberbullying has real consequences',
    ],
    resources: [
      { label: 'Børns Vilkår (DK)', phone: '116111' },
      { label: 'Mobbeland.dk — anti-bullying resources', url: 'https://mobbeland.dk' },
      { label: 'Red Barnet Digital', url: 'https://redbarnet.dk/digitalt' },
    ],
  },
  selfHarm: {
    title: 'Self-Harm Signal Detected',
    icon: '💜',
    whatHappened: 'Custorian detected language suggesting your child may be experiencing self-harm thoughts, suicidal ideation, or extreme emotional distress.',
    whatItMeans: 'This is the most important alert we can give you. Self-harm in young people is often a cry for help, not attention-seeking. Take it seriously but don\'t panic — your calm presence is what they need.',
    howToTalk: [
      'Ask directly: "Are you thinking about hurting yourself?" — direct questions don\'t plant ideas, they open doors.',
      'Listen without judgment. Don\'t say "you have so much to live for" — it invalidates their pain.',
      'Say: "I love you, I\'m here, and we\'re going to get through this together."',
      'Don\'t promise to keep it secret. Say: "I need to make sure you\'re safe, which means getting help."',
      'Remove access to means (medications, sharp objects) without making it a confrontation.',
      'Seek professional help — this is beyond what parenting alone can address.',
    ],
    conversationStarters: [
      '"I\'ve noticed you seem like you\'re going through a hard time. Can I sit with you?"',
      '"I love you no matter what. If you\'re hurting, I want to help."',
      '"There\'s no wrong thing to say right now. I\'m just here to listen."',
    ],
    whatNotToDo: [
      'DON\'T wait to see if it gets better on its own — act now',
      'Don\'t say "think about how this affects me/the family"',
      'Don\'t punish self-harm behavior — it\'s a symptom, not a choice',
      'Don\'t go through their phone in front of them — it breaks trust at a critical moment',
      'Don\'t assume it\'s "just a phase" or "attention-seeking"',
    ],
    resources: [
      { label: 'Emergency: 112', phone: '112' },
      { label: 'Børnetelefonen 24/7', phone: '116111' },
      { label: 'ForældreTelefonen', phone: '35556565' },
      { label: 'Headspace Denmark', url: 'https://headspace.dk' },
      { label: 'Livslinien (suicide prevention)', phone: '70201201' },
      { label: 'BørneTelefonen LIVEchat', url: 'https://bornsvilkar.dk/LIVEchat' },
    ],
  },
  violence: {
    title: 'Violence Concern Detected',
    icon: '⚠️',
    whatHappened: 'Custorian detected language suggesting your child may be planning or fantasizing about violence — threats toward others, weapon references, or manifesto-type language.',
    whatItMeans: 'Most violent language from young people is venting, not planning. But some isn\'t, and the distinction matters. This requires careful assessment — not panic, but not dismissal either.',
    howToTalk: [
      'Stay calm but take it seriously. Ask: "I saw something that worried me. Can you tell me what\'s going on?"',
      'Assess context: Is this a reaction to being bullied? A joke? Genuine rage?',
      'If they\'re being targeted: focus on their safety and report to school/police.',
      'If they\'re expressing violent thoughts: "It sounds like you\'re really angry. I want to understand why."',
      'Get professional assessment if the language is specific (target, time, method).',
    ],
    conversationStarters: [
      '"I know you\'ve been having a hard time. I want to understand what you\'re feeling."',
      '"If someone is hurting you, I need to know so I can help."',
      '"Feeling angry is normal. What you do with that anger is what matters."',
    ],
    whatNotToDo: [
      'Don\'t ignore specific threats with named targets, times, or methods — report immediately',
      'Don\'t overreact to venting — but DO address it',
      'Don\'t shame them for being angry — validate the feeling, redirect the action',
      'Don\'t handle it alone if the threat seems credible — involve school and authorities',
    ],
    resources: [
      { label: 'Emergency: 112', phone: '112' },
      { label: 'Politi (non-emergency)', phone: '114' },
      { label: 'Børns Vilkår', phone: '116111' },
      { label: 'School counselor — contact your school directly' },
    ],
  },
  contentWellness: {
    title: 'Content Wellness Alert',
    icon: '💭',
    whatHappened: 'Custorian detected your child engaging with or expressing interest in content that may affect their mental health — body image issues, harmful trends/challenges, adult content, radicalization, or substance-related content.',
    whatItMeans: 'This is often the earliest warning sign. Before grooming, bullying, or self-harm, there\'s usually a period of consuming harmful content. This is your window to intervene with conversation, not punishment.',
    howToTalk: [
      'Don\'t lead with "I caught you watching..." — lead with curiosity.',
      'Ask: "What do you think about what people say online about how you should look?"',
      'For body image: "Social media shows edited versions of people. How does that make you feel?"',
      'For challenges: "Some viral trends can actually be dangerous. Have you seen any?"',
      'For adult content: "I know you\'re curious — that\'s normal. But a lot of what\'s online isn\'t real, and it can give you wrong ideas about relationships."',
      'For radicalization: "What do you think about what [creator] says? Do you agree with all of it?"',
    ],
    conversationStarters: [
      '"I read that a lot of kids your age feel pressure from social media. Do you ever feel that?"',
      '"If I showed you what I looked like at your age, you\'d laugh. Everyone feels awkward growing up."',
      '"I\'m not going to take your phone. I just want to understand what you\'re watching."',
    ],
    whatNotToDo: [
      'Don\'t ban all social media — it backfires and isolates them',
      'Don\'t body-shame them ("see, you need to exercise more")',
      'Don\'t dismiss their feelings about appearance ("you look fine")',
      'Don\'t lecture about porn — have a conversation about real vs fake',
      'Don\'t mock their interests — understand them first',
    ],
    resources: [
      { label: 'Børns Vilkår — digital wellbeing', url: 'https://bornsvilkar.dk' },
      { label: 'Red Barnet — online safety', url: 'https://redbarnet.dk' },
      { label: 'Common Sense Media — content reviews', url: 'https://commonsensemedia.org' },
      { label: 'Headspace DK — youth mental health', url: 'https://headspace.dk' },
    ],
  },
};

export default function ParentGuideScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const guide = GUIDES[(category as ThreatCategory) || 'grooming'];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.icon}>{guide.icon}</Text>
      <Text style={styles.title}>{guide.title}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What happened</Text>
        <Text style={styles.body}>{guide.whatHappened}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What it means</Text>
        <Text style={styles.body}>{guide.whatItMeans}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to talk to your child</Text>
        {guide.howToTalk.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipNumber}>{i + 1}</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.section, styles.starterCard]}>
        <Text style={styles.sectionTitle}>💬 Conversation starters</Text>
        {guide.conversationStarters.map((starter, i) => (
          <Text key={i} style={styles.starter}>{starter}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚫 What NOT to do</Text>
        {guide.whatNotToDo.map((item, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.dontIcon}>✕</Text>
            <Text style={styles.tipText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📞 Resources</Text>
        {guide.resources.map((r, i) => (
          <TouchableOpacity
            key={i}
            style={styles.resourceRow}
            onPress={() => {
              if (r.phone) Linking.openURL(`tel:${r.phone}`);
              else if (r.url) Linking.openURL(r.url);
            }}
          >
            <Text style={styles.resourceLabel}>{r.label}</Text>
            {r.phone && <Text style={styles.resourceAction}>📞 Call</Text>}
            {r.url && <Text style={styles.resourceAction}>🔗 Open</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: 20 },
  icon: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  body: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  tipRow: { flexDirection: 'row', marginBottom: 10 },
  tipNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, color: Colors.white, textAlign: 'center', lineHeight: 24, fontSize: 13, fontWeight: 'bold', marginRight: 10, marginTop: 1 },
  tipText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  starterCard: { backgroundColor: Colors.primary + '08', borderRadius: 16, padding: 20 },
  starter: { fontSize: 14, color: Colors.text, fontStyle: 'italic', lineHeight: 22, marginBottom: 12, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  dontIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.danger + '20', color: Colors.danger, textAlign: 'center', lineHeight: 24, fontSize: 13, fontWeight: 'bold', marginRight: 10, marginTop: 1 },
  resourceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: Colors.card, borderRadius: 10, marginBottom: 8 },
  resourceLabel: { fontSize: 14, color: Colors.text, flex: 1 },
  resourceAction: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
});
