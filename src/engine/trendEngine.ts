/**
 * Trend Engine — surfaces patterns, not individual alerts.
 *
 * Parents DON'T see every detection. They see:
 * - Weekly trends: "Bullying patterns increased on Discord"
 * - Platform concerns: "Instagram activity is high and concerning"
 * - Behavioral shifts: "Your child seems to be struggling this week"
 * - Guidance: how to bring it up and have the conversation
 *
 * ONLY these trigger IMMEDIATE parent alerts:
 * - CSAM detection (mandatory reporting)
 * - Imminent physical danger (violence planning with specifics)
 * - Child self-reports ("I need help")
 * - Score >= 90 (critical severity)
 */

import { RiskAlert, ThreatCategory } from './riskEngine';

export interface TrendInsight {
  id: string;
  type: 'trend' | 'concern' | 'positive' | 'critical';
  title: string;
  description: string;
  guidance: string;
  conversationStarter: string;
  category?: ThreatCategory;
  platform?: string;
  severity: 'info' | 'watch' | 'act_now';
  timestamp: string;
}

/**
 * Should this alert trigger an IMMEDIATE parent notification?
 * Most alerts should NOT — they feed into weekly trends instead.
 */
export function shouldAlertParentImmediately(alert: RiskAlert): boolean {
  // CSAM — always immediate (legal obligation)
  if (alert.snippet?.includes('CSAM') || alert.snippet?.includes('PhotoDNA')) return true;

  // Child self-reported — they're reaching out
  if (alert.sourceApp === 'Self-Report') return true;

  // Score 90+ = critical threat
  if (alert.score >= 90) return true;

  // Violence with specific planning language
  if (alert.category === 'violence' && alert.score >= 70) return true;

  // Everything else feeds into weekly trends
  return false;
}

/**
 * Generate trend insights from a collection of alerts.
 */
export function generateTrends(alerts: RiskAlert[], periodDays: number = 7): TrendInsight[] {
  const insights: TrendInsight[] = [];
  const now = Date.now();
  const cutoff = now - periodDays * 24 * 60 * 60 * 1000;
  const recent = alerts.filter(a => new Date(a.timestamp).getTime() >= cutoff);

  if (recent.length === 0) {
    insights.push({
      id: 'all-clear',
      type: 'positive',
      title: 'All clear this week',
      description: 'No concerning patterns detected. Your child\'s online activity looks safe.',
      guidance: 'Keep the conversation going — ask what they\'ve been watching or playing.',
      conversationStarter: 'What was the most fun thing you did online this week?',
      severity: 'info',
      timestamp: new Date().toISOString(),
    });
    return insights;
  }

  // Group by category
  const byCategory: Record<string, RiskAlert[]> = {};
  recent.forEach(a => {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    byCategory[a.category].push(a);
  });

  // Group by platform
  const byPlatform: Record<string, RiskAlert[]> = {};
  recent.forEach(a => {
    const app = a.sourceApp || 'Unknown';
    if (!byPlatform[app]) byPlatform[app] = [];
    byPlatform[app].push(a);
  });

  // Compare to prior period
  const priorCutoff = cutoff - periodDays * 24 * 60 * 60 * 1000;
  const prior = alerts.filter(a => {
    const t = new Date(a.timestamp).getTime();
    return t >= priorCutoff && t < cutoff;
  });

  // ── CATEGORY TRENDS ──

  if (byCategory['bullying'] && byCategory['bullying'].length >= 2) {
    const priorBullying = prior.filter(a => a.category === 'bullying').length;
    const increasing = byCategory['bullying'].length > priorBullying;
    insights.push({
      id: 'trend-bullying',
      type: 'concern',
      title: increasing ? 'Bullying patterns are increasing' : 'Bullying patterns detected',
      description: `${byCategory['bullying'].length} bullying-related detections this week${increasing ? ', up from ' + priorBullying + ' last week' : ''}. This could mean your child is being targeted, or witnessing bullying in group chats.`,
      guidance: 'Don\'t ask "are you being bullied?" — kids deny it. Instead, ask about the social dynamics. Watch for withdrawal, mood changes, or reluctance to go online.',
      conversationStarter: 'How are things going with your group chats? Is everyone getting along?',
      category: 'bullying',
      severity: increasing ? 'watch' : 'info',
      timestamp: new Date().toISOString(),
    });
  }

  if (byCategory['selfHarm'] && byCategory['selfHarm'].length >= 1) {
    insights.push({
      id: 'trend-selfharm',
      type: 'concern',
      title: 'Self-harm language detected',
      description: `Your child expressed language associated with emotional distress ${byCategory['selfHarm'].length} time(s) this week. This doesn't always mean immediate danger, but it always means they need support.`,
      guidance: 'Don\'t panic or overreact. Don\'t promise to keep it secret. Do say: "I love you and I\'m here." Ask directly — research shows asking about self-harm does NOT increase risk. Seek professional help.',
      conversationStarter: 'I\'ve been thinking about you. How are you really doing? I want to listen, not lecture.',
      category: 'selfHarm',
      severity: 'act_now',
      timestamp: new Date().toISOString(),
    });
  }

  if (byCategory['grooming'] && byCategory['grooming'].length >= 1) {
    insights.push({
      id: 'trend-grooming',
      type: 'concern',
      title: 'Grooming-related patterns detected',
      description: `${byCategory['grooming'].length} instance(s) of grooming-related patterns this week. This could be an adult building an inappropriate relationship or your child responding to pressure.`,
      guidance: 'Don\'t take their phone — they\'ll stop sharing with you. Screenshot evidence first. Ask open questions about who they talk to online. Contact authorities if there\'s a clear adult involved.',
      conversationStarter: 'Has anyone online ever made you feel uncomfortable or asked you to keep something secret?',
      category: 'grooming',
      severity: 'act_now',
      timestamp: new Date().toISOString(),
    });
  }

  if (byCategory['violence'] && byCategory['violence'].length >= 1) {
    insights.push({
      id: 'trend-violence',
      type: 'concern',
      title: 'Violent language detected',
      description: `Your child used or encountered violent language ${byCategory['violence'].length} time(s) this week. This could range from frustration venting to genuine concern.`,
      guidance: 'Assess context. Is your child angry at someone specific? Are they consuming violent content? Address the root cause — anger is a symptom, not the problem.',
      conversationStarter: 'Sounds like something made you really frustrated lately. Want to talk about it?',
      category: 'violence',
      severity: byCategory['violence'].length >= 3 ? 'act_now' : 'watch',
      timestamp: new Date().toISOString(),
    });
  }

  // ── PLATFORM TRENDS ──

  const riskiestPlatform = Object.entries(byPlatform)
    .sort(([, a], [, b]) => b.length - a.length)[0];

  if (riskiestPlatform && riskiestPlatform[1].length >= 3) {
    insights.push({
      id: 'trend-platform',
      type: 'concern',
      title: `Most activity on ${riskiestPlatform[0]}`,
      description: `${riskiestPlatform[1].length} detections from ${riskiestPlatform[0]} this week. This is where most concerning activity is happening.`,
      guidance: `Learn about ${riskiestPlatform[0]}'s safety settings together. Don't ban the platform — understand why your child uses it and set boundaries collaboratively.`,
      conversationStarter: `What do you mostly use ${riskiestPlatform[0]} for? Can you show me something fun you saw on it?`,
      platform: riskiestPlatform[0],
      severity: 'watch',
      timestamp: new Date().toISOString(),
    });
  }

  // ── POSITIVE SIGNALS ──

  if (recent.length < (prior.length || 1) * 0.7) {
    insights.push({
      id: 'trend-improving',
      type: 'positive',
      title: 'Things are improving',
      description: `Detections are down ${Math.round((1 - recent.length / Math.max(prior.length, 1)) * 100)}% compared to last week. Whatever you\'re doing is working.`,
      guidance: 'Acknowledge the improvement to your child (without revealing monitoring). "I noticed you seem happier lately — that\'s great."',
      conversationStarter: 'You seem like you\'re in a good space lately. What\'s going well?',
      severity: 'info',
      timestamp: new Date().toISOString(),
    });
  }

  // ── OVERALL STATUS ──

  if (insights.length === 0) {
    insights.push({
      id: 'status-normal',
      type: 'info' as any,
      title: 'Normal activity this week',
      description: `${recent.length} detection(s) this week. Nothing requiring immediate action, but stay engaged.`,
      guidance: 'Regular check-ins are more valuable than any monitoring. 10 minutes of genuine interest beats 10 hours of surveillance.',
      conversationStarter: 'What\'s the best thing that happened to you online this week?',
      severity: 'info',
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}
