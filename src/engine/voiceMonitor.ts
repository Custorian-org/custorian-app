/**
 * Voice Monitoring — DISABLED
 *
 * Removed in Custorian strategy v2 (April 2026).
 *
 * Reason: Voice monitoring requires the OpenAI Whisper API (cloud processing),
 * which contradicts Custorian's on-device-only architecture for message content.
 *
 * This module will be re-enabled when on-device speech-to-text reaches
 * sufficient accuracy for threat detection (estimated 2027-2028).
 *
 * See: ~/SkylerOS/Custorian/strategy_v2.md
 */

export const VOICE_MONITORING_ENABLED = false;

export function startVoiceMonitoring(): void {
  console.warn('[Custorian] Voice monitoring is disabled. On-device STT not yet available.');
}

export function stopVoiceMonitoring(): void {
  // no-op
}
