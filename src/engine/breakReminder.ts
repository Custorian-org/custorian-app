/**
 * Screen Time Break Reminders (CS-CD.2.5)
 *
 * Nudges the child to take breaks based on age-appropriate intervals.
 * Not blocking — just a gentle notification.
 */

import { Alert } from 'react-native';
import { AgeBracket } from './ageVerification';

const BREAK_INTERVALS: Record<AgeBracket, number> = {
  '8-10': 30,   // every 30 minutes
  '11-13': 45,  // every 45 minutes
  '14-16': 60,  // every 60 minutes
  '17+': 90,    // every 90 minutes
};

const BREAK_MESSAGES = [
  "Time for a quick break. Look away from the screen for 20 seconds.",
  "You've been on for a while. Stretch, move around, drink some water.",
  "Break time. Your eyes and brain will thank you.",
  "Quick pause. What's happening in the real world right now?",
  "Screen break. Try looking at something far away for 30 seconds.",
];

let breakTimer: ReturnType<typeof setInterval> | null = null;
let sessionStart = 0;

export function startBreakReminders(ageBracket: AgeBracket) {
  const interval = BREAK_INTERVALS[ageBracket] * 60 * 1000;
  sessionStart = Date.now();

  breakTimer = setInterval(() => {
    const msg = BREAK_MESSAGES[Math.floor(Math.random() * BREAK_MESSAGES.length)];
    const minutesUsed = Math.floor((Date.now() - sessionStart) / 60000);

    Alert.alert(
      `${minutesUsed} minutes`,
      msg,
      [{ text: "OK, taking a break", style: 'default' }]
    );
  }, interval);
}

export function stopBreakReminders() {
  if (breakTimer) {
    clearInterval(breakTimer);
    breakTimer = null;
  }
}

export function getBreakInterval(ageBracket: AgeBracket): number {
  return BREAK_INTERVALS[ageBracket];
}
