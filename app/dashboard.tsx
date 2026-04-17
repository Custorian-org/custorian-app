import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Linking, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors, Spacing, Radius } from '../src/constants/theme';
import BottomNav from '../src/components/BottomNav';
import { RiskAlert, ThreatCategory } from '../src/engine/riskEngine';
import { promptReport } from '../src/engine/platformReporter';
import { generateTrends, TrendInsight } from '../src/engine/trendEngine';

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

const conversationGuides: Record<ThreatCategory, { dont: string[]; do: string[]; starters: string[] }> = {
  grooming: {
    dont: [
      "Take their phone or accuse them. They'll stop sharing with you.",
      "Interrogate them about who they're talking to. It feels like punishment.",
      "Say 'I told you so' or blame them. Grooming is NEVER the child's fault.",
      "Immediately contact the other person. You could alert them to delete evidence.",
      "Ground them or restrict their phone as a first response. They need to feel safe telling you things.",
    ],
    do: [
      "Stay calm. Ask open questions. Listen more than you talk.",
      "Reassure them first: 'You're not in trouble. I'm glad you told me.'",
      "Keep the conversation going over days — don't try to resolve it in one talk.",
      "Screenshot everything before the other person can delete it.",
      "Contact the platform's trust & safety team and consider reporting to authorities.",
    ],
    starters: [
      "I noticed something online that worried me. Can we talk about the people you chat with?",
      "Has anyone online ever asked you to keep something secret from me?",
      "I want you to know — if anyone ever makes you feel weird online, you can always tell me. No matter what.",
      "Who are the people you talk to most online? I'd love to know more about your friends.",
      "Have you ever felt uncomfortable about something someone said to you online?",
      "I read that some adults pretend to be kids online. Have you ever noticed anything like that?",
    ],
  },
  bullying: {
    dont: [
      "Tell them to just ignore it, or confront the bully yourself.",
      "Say 'kids will be kids' or minimise what happened.",
      "Take their phone away — they'll feel punished for being a victim.",
      "Promise to fix it immediately. Sometimes they just need to be heard first.",
      "Post about it on social media or contact the bully's parents without a plan.",
    ],
    do: [
      "Validate their feelings. Screenshot evidence. Report together.",
      "Ask what THEY want to happen. Give them agency in the response.",
      "Help them block the person and report to the platform.",
      "Check in regularly — bullying rarely stops after one incident.",
      "Contact the school counsellor if it involves classmates.",
    ],
    starters: [
      "How are things going with your friends online? Is everyone being kind?",
      "I saw something that made me think someone might be treating you badly. Want to talk about it?",
      "Has anyone said something to you online that made you feel bad about yourself?",
      "You know you can always show me something on your phone if someone is being mean, right?",
      "If one of your friends was being bullied online, what would you tell them to do?",
      "Is there anyone at school or online who you used to be friends with but things changed?",
    ],
  },
  selfHarm: {
    dont: [
      "Panic, cry, or make it about your feelings. Don't promise to keep it secret.",
      "Say 'you have nothing to be sad about' or 'others have it worse.'",
      "Leave them alone after the conversation. Stay close.",
      "Treat it as attention-seeking. Even if it is — that IS a cry for help.",
      "Make promises you can't keep like 'everything will be fine.'",
    ],
    do: [
      "Stay calm. Tell them you love them. Ask directly. Seek professional help.",
      "Say: 'I'm not going anywhere. Let's figure this out together.'",
      "Remove access to means if possible (medications, sharp objects).",
      "Call a crisis line together if they're open to it — you don't have to do this alone.",
      "Follow up every single day. One conversation is not enough.",
    ],
    starters: [
      "I love you and I'm here for you no matter what. Can you tell me how you've been feeling?",
      "I noticed you've been quiet lately. Is everything okay? I want to listen.",
      "You are so important to me. If you're hurting, I want to help. Will you let me?",
      "There's nothing you could tell me that would make me love you less. What's going on?",
      "I've been worried about you. Can we sit together and talk? No pressure.",
      "Have you been feeling okay lately? I'm asking because I care, not because you're in trouble.",
    ],
  },
  violence: {
    dont: [
      "Dismiss it as 'just venting' or escalate with punishment.",
      "Ignore it. Even venting about violence should be taken seriously.",
      "Respond with anger — it validates the idea that anger = power.",
      "Share what you found with other parents before talking to your child.",
      "Wait and see if it happens again. Address it now.",
    ],
    do: [
      "Take it seriously. Assess if there's real intent. Contact school or authorities if needed.",
      "Ask what happened that made them so angry. Address the root cause.",
      "Help them find healthy ways to express frustration (exercise, writing, talking).",
      "If there's any mention of specific plans or weapons — contact authorities immediately.",
      "Monitor closely for the next few weeks. One conversation isn't enough.",
    ],
    starters: [
      "I can see you're really angry about something. What's going on? I want to help.",
      "Sounds like something made you really frustrated. Want to talk about it?",
      "I know things can feel overwhelming sometimes. Let's figure this out together.",
      "Everyone gets angry — what matters is what we do with it. What happened?",
      "Is someone at school or online making you feel this way? I want to understand.",
      "I noticed some strong language. I'm not mad — I just want to make sure you're okay.",
    ],
  },
  contentWellness: {
    dont: [
      "Ban all social media or shame them for what they've been watching.",
      "Overreact to one instance. Look for patterns, not single events.",
      "Lecture them about screen time. They already know.",
      "Compare them to other kids: 'Your friend doesn't watch that.'",
      "Spy on them without having a conversation first.",
    ],
    do: [
      "Be curious, not judgemental. Discuss how content makes them feel.",
      "Watch or explore the content together. Understand what appeals to them.",
      "Talk about how algorithms work — the content is designed to be addictive.",
      "Set boundaries together, not unilaterally. They're more likely to stick.",
      "Suggest alternatives rather than just removing what they have.",
    ],
    starters: [
      "I've been thinking about the stuff we see online. Does anything you've seen lately make you feel bad about yourself?",
      "What's your favourite thing to watch right now? Can you show me?",
      "Do you ever feel like you can't stop scrolling even when you want to?",
      "I read that some content online can make people feel worse about themselves. Have you noticed that?",
      "If you could change one thing about how you use your phone, what would it be?",
      "What do your friends mostly watch or talk about online?",
    ],
  },
};

function getRandomGuide(category: ThreatCategory) {
  const guide = conversationGuides[category];
  return {
    dont: guide.dont[Math.floor(Math.random() * guide.dont.length)],
    do: guide.do[Math.floor(Math.random() * guide.do.length)],
    starter: guide.starters[Math.floor(Math.random() * guide.starters.length)],
  };
}

// Pattern-based descriptions — never show the actual message
const patternDescriptions: Record<string, string> = {
  secrecy_request: 'Someone asked your child to keep a conversation secret from you',
  age_probing: 'Someone asked your child personal questions about their age',
  flattery: 'Your child received unusual compliments from an older contact',
  photo_request: 'Someone asked your child to share photos of themselves',
  meetup: 'Someone suggested meeting your child in person',
  isolation_tactic: 'Someone tried to isolate your child from friends or family',
  platform_migration: 'Someone asked your child to move to a different, more private platform',
  boundary_testing: 'Someone is gradually pushing your child\'s boundaries',
  rapid_escalation: 'A conversation escalated from casual to personal unusually quickly',
  gift_bribery: 'Someone offered your child gifts or money',
  direct_insult: 'Your child received direct verbal abuse',
  social_rejection: 'Your child was excluded or rejected by peers online',
  threat: 'Someone made a threatening statement toward your child',
  crisis_language: 'Your child expressed language suggesting emotional distress',
  hopelessness: 'Your child expressed feelings of hopelessness',
  method_discussion: 'Concerning language about self-harm methods was detected',
  weapon_mention: 'A conversation included references to weapons',
  violence_planning: 'Concerning language about planned violence was detected',
};

const categoryInsights: Record<ThreatCategory, { whatItMeans: string; whatToWatch: string; urgency: string }> = {
  grooming: {
    whatItMeans: 'An adult or older person may be building an inappropriate relationship with your child. Grooming follows predictable patterns: flattery, secrecy, isolation, escalation.',
    whatToWatch: 'Is your child being more secretive about their phone? Have they mentioned a new "friend" they met online? Are they receiving gifts or money they can\'t explain?',
    urgency: 'If the score is HIGH, review immediately. Grooming escalates — the average time from first contact to exploitation request is 45 minutes.',
  },
  bullying: {
    whatItMeans: 'Your child is receiving hurtful, threatening, or exclusionary messages. Cyberbullying can happen 24/7 and follows children home from school.',
    whatToWatch: 'Is your child withdrawing from activities they used to enjoy? Are they anxious about checking their phone? Changes in sleep, appetite, or mood?',
    urgency: 'Bullying compounds over time. One incident is manageable — a pattern needs intervention.',
  },
  selfHarm: {
    whatItMeans: 'Your child has expressed thoughts or language associated with self-harm or emotional crisis. This does not always mean imminent danger, but it always means they need support.',
    whatToWatch: 'Long sleeves in warm weather. Withdrawal from friends and family. Giving away possessions. Sudden calmness after a period of depression.',
    urgency: 'Take this seriously every time. Even if it seems like "attention-seeking" — that IS a cry for help. Contact Børnetelefonen (116 111) or your local crisis line.',
  },
  violence: {
    whatItMeans: 'Threatening or violent language was detected. This could range from venting frustration to genuine intent — context matters.',
    whatToWatch: 'Is your child being bullied and retaliating? Are they consuming violent content? Have they mentioned specific plans, targets, or access to weapons?',
    urgency: 'If there is any mention of specific plans, targets, or weapons — contact authorities immediately. Do not wait.',
  },
  contentWellness: {
    whatItMeans: 'Your child is engaging with content that may affect their wellbeing — body image pressure, eating disorder content, dangerous challenges, or age-inappropriate material.',
    whatToWatch: 'Changes in eating habits. Negative self-talk about appearance. Attempting viral challenges. Accessing content meant for older audiences.',
    urgency: 'Usually not urgent, but persistent exposure shapes attitudes over time. A conversation now prevents problems later.',
  },
};

function getPatternDescription(alert: RiskAlert): string {
  if (alert.triggeredPatterns && alert.triggeredPatterns.length > 0) {
    const desc = alert.triggeredPatterns
      .map(p => patternDescriptions[p] || p.replace(/_/g, ' '))
      .filter((v, i, a) => a.indexOf(v) === i) // dedupe
      .slice(0, 2)
      .join('. ');
    return desc + '.';
  }
  // Fallback — category-level description, never the message
  const fallbacks: Record<string, string> = {
    grooming: 'Grooming behaviour patterns detected in a conversation on ' + alert.sourceApp,
    bullying: 'Bullying language detected in a conversation on ' + alert.sourceApp,
    selfHarm: 'Self-harm related language detected on ' + alert.sourceApp,
    violence: 'Violent or threatening language detected on ' + alert.sourceApp,
    contentWellness: 'Potentially harmful content detected on ' + alert.sourceApp,
  };
  return fallbacks[alert.category] || 'A potential risk was detected on ' + alert.sourceApp;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { alerts, clearAlerts, markReviewed, verifyPin, pin } = useGuard();
  const [unlocked, setUnlocked] = useState(!pin);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const next = pinInput + d;
                    setPinInput(next);
                    setPinError(false);
                    if (next.length === 4) {
                      if (verifyPin(next)) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setUnlocked(true);
                      } else {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        <BottomNav />
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
      <TouchableOpacity style={[
        styles.alertCard,
        item.score >= 80 && styles.alertCardCritical,
        (item.category === 'selfHarm' || item.category === 'violence') && item.score >= 80 && styles.alertCardUrgent,
      ]} onPress={() => markReviewed(item.id)} activeOpacity={0.7}>
        <View style={[styles.alertStripe, { backgroundColor: color, width: item.score >= 80 ? 6 : 4 }]} />
        <View style={styles.alertBody}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>{categoryLabels[item.category]}</Text>
            {!item.reviewed && (
              <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
            )}
          </View>
          <Text style={styles.alertSnippet} numberOfLines={2}>{getPatternDescription(item)}</Text>
          <View style={styles.alertMeta}>
            <Text style={styles.alertTime}>{formatTime(item.timestamp)} · {item.sourceApp}</Text>
            <View style={[styles.scoreBadge, { backgroundColor: color + '15', borderColor: color + '30' }]}>
              <Text style={[styles.scoreText, { color }]}>
                {item.score >= 80 ? 'HIGH' : item.score >= 60 ? 'MED' : 'LOW'}
              </Text>
            </View>
          </View>

          {/* What this means — context for parents */}
          <View style={styles.triggerCard}>
            <Text style={styles.triggerTitle}>What this means</Text>
            <Text style={styles.triggerPatterns}>{categoryInsights[item.category].whatItMeans}</Text>
          </View>

          {/* What to watch for */}
          <View style={[styles.triggerCard, { backgroundColor: '#fef3c7', borderColor: '#f59e0b20' }]}>
            <Text style={[styles.triggerTitle, { color: '#92400e' }]}>What to watch for</Text>
            <Text style={[styles.triggerPatterns, { color: '#78350f' }]}>{categoryInsights[item.category].whatToWatch}</Text>
          </View>

          {/* Patterns detected */}
          {item.triggeredPatterns && item.triggeredPatterns.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {item.triggeredPatterns.map((p, i) => (
                <View key={i} style={{ backgroundColor: categoryColors[item.category] + '12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: categoryColors[item.category] }}>{p.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          )}

          {/* App context */}
          <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f9fafb', borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#6b7280' }}>Platform: {item.sourceApp}</Text>
            <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Detected at {new Date(item.timestamp).toLocaleString()}</Text>
          </View>

          {/* Conversation guide — collapsible */}
          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => setExpandedGuide(expandedGuide === item.id ? null : item.id)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.guideTitle}>How to talk about this</Text>
              <Text style={{ color: Colors.primary, fontSize: 16 }}>{expandedGuide === item.id ? '−' : '+'}</Text>
            </View>
            {expandedGuide === item.id && (
              <View style={{ marginTop: 8 }}>
                {(() => { const g = getRandomGuide(item.category); return (<>
                <Text style={styles.guideDont}>Don't: {g.dont}</Text>
                <Text style={styles.guideDo}>Do: {g.do}</Text>
                <Text style={styles.guideStarter}>Try saying: "{g.starter}"</Text>
                </>); })()}
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.reportButton, { flex: 1 }]}
              onPress={() => promptReport(item, (url) => Linking.openURL(url))}
            >
              <Text style={styles.reportText}>Report to platform →</Text>
            </TouchableOpacity>

            {(item.score >= 70 || item.category === 'grooming' || item.category === 'violence') && (
              <TouchableOpacity
                style={[styles.reportButton, { flex: 1, backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}
                onPress={() => {
                  const locale = require('react-native').Platform.OS === 'ios'
                    ? (require('react-native').NativeModules.SettingsManager?.settings?.AppleLocale || 'en_US')
                    : 'en_US';
                  const countryCode = locale.split(/[-_]/).pop()?.toUpperCase() || 'US';
                  const { getReportingDestination } = require('../src/engine/mandatoryReporting');
                  const dest = getReportingDestination(countryCode);

                  Alert.alert(
                    'Report to Authorities',
                    `For ${countryCode}, reports go to:\n\n${dest.name}\n${dest.notes}\n\nThis will open the reporting website. You can also export the full alert history from Settings for law enforcement.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: `Open ${dest.name}`, onPress: () => Linking.openURL(dest.url) },
                      { text: 'Export alert history', onPress: () => {
                        const { exportForLawEnforcement } = require('../src/engine/reportHistory');
                        exportForLawEnforcement().then((json: string) => {
                          require('react-native').Share.share({ message: json, title: 'Custorian Alert History' });
                        });
                      }},
                    ]
                  );
                }}
              >
                <Text style={[styles.reportText, { color: '#dc2626' }]}>Report to authorities →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const trends = useMemo(() => generateTrends(alerts), [alerts]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const criticalAlerts = alerts.filter(a => a.score >= 90 || a.sourceApp === 'Self-Report');

  const severityColors = { info: '#10b981', watch: '#f59e0b', act_now: '#ef4444' };
  const severityLabels = { info: 'All good', watch: 'Watch', act_now: 'Act now' };
  const typeIcons = { trend: '📊', concern: '⚠️', positive: '✅', critical: '🚨' };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Weekly Insights</Text>
          <Text style={styles.subtitle}>How your child is doing online</Text>
        </View>

        {/* Trend insights */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          {trends.map((t) => (
            <View key={t.id} style={{
              backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12,
              borderWidth: 1, borderColor: t.severity === 'act_now' ? '#fecaca' : t.severity === 'watch' ? '#fde68a' : '#e5e7eb',
              borderLeftWidth: 4, borderLeftColor: severityColors[t.severity],
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1a1a2e', flex: 1 }}>{typeIcons[t.type]} {t.title}</Text>
                <View style={{ backgroundColor: severityColors[t.severity] + '20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: severityColors[t.severity] }}>{severityLabels[t.severity]}</Text>
                </View>
              </View>

              <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 19, marginBottom: 12 }}>{t.description}</Text>

              <View style={{ backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534', marginBottom: 4 }}>What to do</Text>
                <Text style={{ fontSize: 12, color: '#15803d', lineHeight: 17 }}>{t.guidance}</Text>
              </View>

              <View style={{ backgroundColor: '#eff6ff', borderRadius: 10, padding: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#1e40af', marginBottom: 4 }}>Try saying</Text>
                <Text style={{ fontSize: 12, color: '#1d4ed8', lineHeight: 17, fontStyle: 'italic' }}>"{t.conversationStarter}"</Text>
              </View>

              {t.platform && (
                <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 8 }}>Platform: {t.platform}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Critical alerts — only if any exist */}
        {criticalAlerts.length > 0 && (
          <View style={{ paddingHorizontal: Spacing.lg, marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#dc2626', marginBottom: 12 }}>🚨 Requires immediate attention</Text>
            {criticalAlerts.slice(0, 5).map(a => (
              <TouchableOpacity key={a.id} style={{
                backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 8,
                borderWidth: 1, borderColor: '#fecaca',
              }} onPress={() => markReviewed(a.id)}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#dc2626' }}>{categoryLabels[a.category]}</Text>
                <Text style={{ fontSize: 12, color: '#991b1b', marginTop: 4 }}>{getPatternDescription(a)}</Text>
                <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{a.sourceApp} · {new Date(a.timestamp).toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Activity summary */}
        <View style={{ paddingHorizontal: Spacing.lg, marginTop: 16 }}>
          <View style={{ backgroundColor: '#f9fafb', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 }}>This week at a glance</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.primary }}>{alerts.length}</Text>
                <Text style={{ fontSize: 10, color: '#9ca3af' }}>Detections</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: criticalAlerts.length > 0 ? '#ef4444' : '#10b981' }}>{criticalAlerts.length}</Text>
                <Text style={{ fontSize: 10, color: '#9ca3af' }}>Critical</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#3b82f6' }}>
                  {[...new Set(alerts.map(a => a.sourceApp))].length}
                </Text>
                <Text style={{ fontSize: 10, color: '#9ca3af' }}>Platforms</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#f59e0b' }}>
                  {alerts.filter(a => a.sourceApp === 'Self-Report').length}
                </Text>
                <Text style={{ fontSize: 10, color: '#9ca3af' }}>Self-reports</Text>
              </View>
            </View>
          </View>
        </View>

        {/* View all alerts toggle */}
        <View style={{ paddingHorizontal: Spacing.lg, marginTop: 16, marginBottom: 16 }}>
          <TouchableOpacity
            style={{ padding: 12, alignItems: 'center' }}
            onPress={() => setShowAllAlerts(!showAllAlerts)}
          >
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>{showAllAlerts ? 'Hide detailed log ▲' : 'View detailed log ▼'}</Text>
          </TouchableOpacity>

          {showAllAlerts && (
            <>
              <FlatList
                data={alerts}
                keyExtractor={(a) => a.id}
                renderItem={renderAlert}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => Alert.alert('Clear all?', 'This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clearAlerts },
                ])}
              >
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  backBtn: { fontSize: 14, color: '#7c3aed', marginBottom: Spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 4 },

  // Empty
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 4 },

  // Alert cards
  alertCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb',
  },
  alertCardCritical: { borderColor: Colors.danger + '30', borderWidth: 2 },
  alertCardUrgent: { backgroundColor: Colors.danger + '06', borderColor: Colors.danger + '40' },
  alertStripe: { width: 4 },
  alertBody: { flex: 1, padding: Spacing.lg },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  newBadge: { backgroundColor: Colors.danger, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  newBadgeText: { color: Colors.text, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  alertSnippet: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 8 },
  alertMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertTime: { fontSize: 11, color: '#9ca3af' },
  scoreBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  scoreText: { fontSize: 10, fontWeight: '700' },
  // Trigger explanation
  triggerCard: { marginTop: 10, backgroundColor: '#F5F7FA', borderRadius: Radius.sm, padding: 10, borderWidth: 1, borderColor: Colors.border },
  triggerTitle: { fontSize: 10, fontWeight: '700', color: Colors.textMute, letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 4 },
  triggerPatterns: { fontSize: 12, color: Colors.text, fontWeight: '500' },

  // Conversation guide
  guideCard: { marginTop: 12, backgroundColor: Colors.accentLight, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '15' },
  guideTitle: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  guideDont: { fontSize: 12, color: Colors.danger, lineHeight: 17, marginBottom: 4 },
  guideDo: { fontSize: 12, color: Colors.safe, lineHeight: 17, marginBottom: 6 },
  guideStarter: { fontSize: 12, color: Colors.text, lineHeight: 17, fontStyle: 'italic' },

  reportButton: { marginTop: 10, backgroundColor: '#fef2f2', borderRadius: Radius.sm, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ef444430' },
  reportText: { fontSize: 12, fontWeight: '600', color: '#ef4444' },

  // Clear
  clearButton: { padding: Spacing.lg, alignItems: 'center', borderTopWidth: 1, borderColor: '#e5e7eb' },
  clearText: { color: Colors.danger, fontWeight: '600', fontSize: 14 },

  // PIN screen
  pinContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  pinLock: { marginBottom: Spacing.xl },
  pinLockCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.card, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  pinLockIcon: { fontSize: 28, color: '#7c3aed' },
  pinTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  pinSubtitle: { fontSize: 13, color: '#9ca3af', marginBottom: Spacing.xl },
  pinDots: { flexDirection: 'row', marginBottom: Spacing.xl, gap: 16 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#e5e7eb', backgroundColor: 'transparent' },
  pinDotFilled: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pinPad: { flexDirection: 'row', flexWrap: 'wrap', width: 264, justifyContent: 'center' },
  pinKey: { width: 80, height: 60, justifyContent: 'center', alignItems: 'center', margin: 4, borderRadius: Radius.md, backgroundColor: Colors.card },
  pinKeyText: { fontSize: 24, fontWeight: '500', color: Colors.text },
  backLink: { fontSize: 14, color: '#7c3aed' },
});
