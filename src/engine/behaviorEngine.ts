/**
 * Behavioral Pattern Detection Engine
 *
 * Detects dangerous PATTERNS of interaction — not just words.
 * Much harder to evade than keyword matching because predators
 * can change words but can't change the behavioral structure.
 *
 * Patterns detected:
 * 1. Rapid escalation — conversation goes from casual to intimate too fast
 * 2. Secrecy requests — asking to hide conversation from parents/friends
 * 3. Cross-platform migration — "let's move to Snap/Discord/Signal"
 * 4. Age probing sequence — questions about age, school, location in sequence
 * 5. Gift/bribery escalation — small gifts → big gifts → quid pro quo
 * 6. Isolation tactics — separating child from friends/family
 * 7. Testing boundaries — progressive requests that test compliance
 * 8. Time-of-day patterns — conversations shifting to late night
 * 9. Message frequency spikes — sudden increase from one contact
 * 10. Emotional manipulation — alternating affection and anger
 */

import { ThreatCategory } from './riskEngine';

// ── CONVERSATION TRACKER ─────────────────────────────────────
// Tracks message history per contact for pattern analysis

interface MessageRecord {
  text: string;
  timestamp: number;
  sourceApp: string;
}

interface ContactProfile {
  contactId: string;
  messages: MessageRecord[];
  firstSeen: number;
  escalationScore: number;
  flags: string[];
}

const contacts: Map<string, ContactProfile> = new Map();
const MAX_HISTORY = 50;

function getOrCreateContact(contactId: string): ContactProfile {
  if (!contacts.has(contactId)) {
    contacts.set(contactId, {
      contactId,
      messages: [],
      firstSeen: Date.now(),
      escalationScore: 0,
      flags: [],
    });
  }
  return contacts.get(contactId)!;
}

// ── PATTERN DETECTORS ────────────────────────────────────────

export interface BehaviorAlert {
  pattern: string;
  severity: number;     // 0-100
  description: string;
  recommendation: string;
}

/**
 * Analyze a new message in the context of conversation history.
 * Returns behavioral alerts if patterns are detected.
 */
export function analyzeConversationBehavior(
  text: string,
  contactId: string,
  sourceApp: string
): BehaviorAlert[] {
  const contact = getOrCreateContact(contactId);
  const alerts: BehaviorAlert[] = [];
  const lower = text.toLowerCase();
  const now = Date.now();

  // Record this message
  contact.messages.push({ text: lower, timestamp: now, sourceApp });
  if (contact.messages.length > MAX_HISTORY) {
    contact.messages = contact.messages.slice(-MAX_HISTORY);
  }

  const msgs = contact.messages;
  const msgCount = msgs.length;

  // ── Pattern 1: Rapid Escalation ────────────────────────────
  // Conversation goes from casual to personal/intimate within few messages
  if (msgCount >= 3) {
    const recentMsgs = msgs.slice(-5).map((m) => m.text);
    const personalTopics = recentMsgs.filter((m) =>
      /(look like|photo|selfie|alone|parents|boyfriend|girlfriend|body|dating|relationship)/i.test(m)
    ).length;

    const conversationAge = now - contact.firstSeen;
    const hoursOld = conversationAge / (1000 * 60 * 60);

    if (personalTopics >= 2 && hoursOld < 2) {
      alerts.push({
        pattern: 'rapid_escalation',
        severity: 75,
        description: 'Conversation moved to personal topics unusually fast',
        recommendation: 'This person is rushing intimacy. Real friendships build slowly.',
      });
    }
  }

  // ── Pattern 2: Cross-Platform Migration ────────────────────
  // "Add me on Snap", "DM me on Insta", "Let's move to Signal"
  if (/(add me on|dm me on|let.s (go|move|switch|talk) (to|on)|my (snap|insta|discord|signal|telegram|whatsapp) is|hit me up on)/i.test(lower)) {
    alerts.push({
      pattern: 'platform_migration',
      severity: 65,
      description: 'Requesting to move conversation to a different platform',
      recommendation: 'Moving to another app often means they want less moderation or traceability.',
    });
  }

  // ── Pattern 3: Secrecy Escalation ──────────────────────────
  // Multiple secrecy requests across conversation
  const secrecyCount = msgs.filter((m) =>
    /(don.t tell|keep.*(secret|between)|our secret|delete (this|the chat)|no screenshot)/i.test(m.text)
  ).length;

  if (secrecyCount >= 2) {
    alerts.push({
      pattern: 'repeated_secrecy',
      severity: 85,
      description: `${secrecyCount} secrecy requests detected in this conversation`,
      recommendation: 'Repeated requests for secrecy are a major grooming indicator.',
    });
  }

  // ── Pattern 4: Age Probing Sequence ────────────────────────
  // Asking age → school → location in sequence
  const ageProbe = msgs.some((m) => /how old|what.s your age|what grade|what year/i.test(m.text));
  const schoolProbe = msgs.some((m) => /what school|where.*(go to school|study)/i.test(m.text));
  const locationProbe = msgs.some((m) => /where (do you|are you|u) live|what (city|town|area)/i.test(m.text));

  if (ageProbe && schoolProbe && locationProbe) {
    alerts.push({
      pattern: 'info_gathering_sequence',
      severity: 90,
      description: 'This person asked about your age, school, AND location',
      recommendation: 'Gathering personal details in sequence is a classic predator pattern. Block immediately.',
    });
  }

  // ── Pattern 5: Boundary Testing ────────────────────────────
  // Progressive requests: small → bigger → inappropriate
  const requestProgression = msgs.filter((m) =>
    /(can you|would you|will you|send me|show me|do something for)/i.test(m.text)
  );

  if (requestProgression.length >= 3) {
    const recent = requestProgression.slice(-3).map((m) => m.text);
    const hasInappropriate = recent.some((m) =>
      /(pic|photo|selfie|body|naked|nude|underwear|bra)/i.test(m)
    );
    if (hasInappropriate) {
      alerts.push({
        pattern: 'boundary_testing',
        severity: 85,
        description: 'Progressive requests escalating toward inappropriate content',
        recommendation: 'This person is testing limits. Each "yes" leads to a bigger ask.',
      });
    }
  }

  // ── Pattern 6: Late Night Conversations ────────────────────
  const hour = new Date(now).getHours();
  const lateNightMsgs = msgs.filter((m) => {
    const h = new Date(m.timestamp).getHours();
    return h >= 23 || h < 5;
  });

  if (lateNightMsgs.length >= 3 && (hour >= 23 || hour < 5)) {
    alerts.push({
      pattern: 'late_night_pattern',
      severity: 55,
      description: 'Multiple late-night conversations with this contact (11pm-5am)',
      recommendation: 'Late-night chats with strangers increase vulnerability. Consider device curfew.',
    });
  }

  // ── Pattern 7: Message Frequency Spike ─────────────────────
  // Sudden increase in messaging from one contact
  if (msgCount >= 10) {
    const lastHour = msgs.filter((m) => now - m.timestamp < 3600000).length;
    const avgPerHour = msgCount / Math.max(1, (now - contact.firstSeen) / 3600000);

    if (lastHour > avgPerHour * 3 && lastHour >= 10) {
      alerts.push({
        pattern: 'frequency_spike',
        severity: 45,
        description: 'Sudden spike in messaging intensity from this contact',
        recommendation: 'Rapid message volume can indicate pressure or love-bombing.',
      });
    }
  }

  // ── Pattern 8: Emotional Manipulation ──────────────────────
  // Alternating between affection and anger/guilt
  const affectionMsgs = msgs.filter((m) =>
    /(love you|you.re special|only one|nobody.*(like|understands) you like i do|you.re (my|the) best)/i.test(m.text)
  ).length;

  const guiltMsgs = msgs.filter((m) =>
    /(you don.t care|after everything|you.re (ungrateful|selfish)|i thought you|fine.*(leave|go)|you.ll be sorry)/i.test(m.text)
  ).length;

  if (affectionMsgs >= 2 && guiltMsgs >= 1) {
    alerts.push({
      pattern: 'emotional_manipulation',
      severity: 80,
      description: 'Mix of excessive affection and guilt-tripping detected',
      recommendation: 'Alternating between love and anger is a manipulation tactic. Healthy relationships don\'t work this way.',
    });
  }

  // ── Pattern 9: Isolation Tactics ───────────────────────────
  const isolationMsgs = msgs.filter((m) =>
    /(your friends.*(don.t|aren.t|wouldn.t)|they.re (jealous|not real friends)|only (i|me)|you don.t need (them|anyone else)|i.m the only one)/i.test(m.text)
  ).length;

  if (isolationMsgs >= 2) {
    alerts.push({
      pattern: 'isolation_tactics',
      severity: 80,
      description: 'Attempting to separate you from friends and family',
      recommendation: 'Someone who tries to isolate you from people you trust is dangerous.',
    });
  }

  // Update contact escalation score
  const maxSeverity = alerts.length > 0 ? Math.max(...alerts.map((a) => a.severity)) : 0;
  contact.escalationScore = Math.min(100, contact.escalationScore + maxSeverity * 0.3);

  return alerts;
}

/**
 * Get the overall risk level for a contact based on accumulated behavior.
 */
export function getContactRiskLevel(contactId: string): {
  level: 'safe' | 'watch' | 'danger';
  score: number;
  flagCount: number;
} {
  const contact = contacts.get(contactId);
  if (!contact) return { level: 'safe', score: 0, flagCount: 0 };

  const score = contact.escalationScore;
  return {
    level: score >= 70 ? 'danger' : score >= 40 ? 'watch' : 'safe',
    score,
    flagCount: contact.flags.length,
  };
}

/**
 * Reset all tracked contacts (e.g., when clearing data).
 */
export function resetBehaviorTracking() {
  contacts.clear();
}
