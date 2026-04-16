/**
 * Child Self-Report — CS-CD.3.4
 * "I need help" button — child can flag something themselves.
 * Maximum 2 taps to report (framework requirement).
 *
 * Flow:
 * 1. Child taps shield/help icon (always visible)
 * 2. Selects category or "I'm not sure"
 * 3. Optional: type what happened
 * 4. Alert sent to parent + intervention shown to child
 */

import { RiskAlert, ThreatCategory } from './riskEngine';

export interface SelfReport {
  id: string;
  timestamp: string;
  category: ThreatCategory | 'unsure';
  description: string;
  sourceApp: string;
  escalated: boolean;
}

const CATEGORY_PROMPTS: Record<string, { label: string; icon: string; followUp: string }> = {
  grooming: {
    label: 'Someone is making me uncomfortable',
    icon: '🛡️',
    followUp: "You did the right thing. No one should make you feel uncomfortable online. Your parent knows you asked for help — but they can't see your messages. Nobody will get in trouble because of you.",
  },
  bullying: {
    label: "Someone is being mean to me",
    icon: '💙',
    followUp: "That wasn't okay and it's not your fault. Your parent knows something happened but they won't see what was said. Telling is brave, not snitching.",
  },
  selfHarm: {
    label: "I'm feeling really bad",
    icon: '💜',
    followUp: "You're incredibly brave for reaching out. Your parent knows you need support but not what you said. You're not in trouble. You're not bothering anyone. You matter.",
  },
  violence: {
    label: "Someone is threatening me",
    icon: '⏸️',
    followUp: "That sounds scary, and it's not okay. Your parent has been told — but the person who threatened you won't know you told anyone. You're safe.",
  },
  unsure: {
    label: "Something feels wrong but I'm not sure what",
    icon: '💭',
    followUp: "It's okay not to know exactly what's wrong. Trusting your gut is smart. Your parent knows you reached out but can't see your private messages. You won't get anyone in trouble.",
  },
};

export function getSelfReportCategories() {
  return Object.entries(CATEGORY_PROMPTS).map(([key, val]) => ({
    key,
    ...val,
  }));
}

export function createSelfReport(
  category: ThreatCategory | 'unsure',
  description: string = '',
  sourceApp: string = 'Self-report',
): { report: SelfReport; alert: RiskAlert; followUp: string } {
  const id = Date.now().toString();
  const timestamp = new Date().toISOString();
  const prompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.unsure;

  const report: SelfReport = {
    id,
    timestamp,
    category,
    description,
    sourceApp,
    escalated: category === 'selfHarm' || category === 'violence',
  };

  // Create an alert for the parent dashboard
  const alert: RiskAlert = {
    id,
    category: category === 'unsure' ? 'contentWellness' : category,
    score: category === 'selfHarm' || category === 'violence' ? 90 : 70,
    snippet: `CHILD SELF-REPORT: ${prompt.label}${description ? ` — "${description}"` : ''}`,
    sourceApp: 'Self-Report',
    timestamp,
    reviewed: false,
  };

  return { report, alert, followUp: prompt.followUp };
}
