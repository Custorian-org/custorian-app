/**
 * Age Verification — multi-signal age confidence system.
 *
 * Custorian doesn't need to know the child's exact birthday.
 * It needs to know their age bracket (8-10, 11-13, 14-16, 17+)
 * to set appropriate detection thresholds, screen time limits,
 * and intervention messaging.
 *
 * Verification tiers:
 * 1. Parent attestation (entered during onboarding)
 * 2. Device family account age (Apple Family Sharing / Google Family Link)
 * 3. School deployment age bracket (school admin sets it)
 * 4. EU Digital Identity Wallet (future — age credential without revealing identity)
 *
 * Privacy: No face scans. No ID uploads. No biometrics.
 * We read existing trusted signals, not create new invasive ones.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AgeBracket = '8-10' | '11-13' | '14-16' | '17+';

export interface AgeProfile {
  bracket: AgeBracket;
  exactAge?: number;             // if parent provided it
  source: AgeSource;
  confidence: AgeConfidence;
  verifiedAt: string;            // ISO timestamp
}

export type AgeSource =
  | 'parent_attestation'         // parent entered during onboarding
  | 'device_family_account'      // read from Apple/Google family settings
  | 'school_deployment'          // school admin set the age bracket
  | 'eu_digital_wallet'          // EU age credential (future)
  | 'combined';                  // multiple signals agree

export type AgeConfidence = 'high' | 'medium' | 'low';

const AGE_PROFILE_KEY = 'custorian_age_profile';

// ── AGE BRACKET HELPERS ─────────────────────────────────────

export function ageToBracket(age: number): AgeBracket {
  if (age <= 10) return '8-10';
  if (age <= 13) return '11-13';
  if (age <= 16) return '14-16';
  return '17+';
}

export function bracketToMinAge(bracket: AgeBracket): number {
  switch (bracket) {
    case '8-10': return 8;
    case '11-13': return 11;
    case '14-16': return 14;
    case '17+': return 17;
  }
}

// ── DEVICE FAMILY ACCOUNT AGE ───────────────────────────────
// Reads age from Apple Family Sharing or Google Family Link.
// In Expo Go this returns null — only works in native builds.

export async function getDeviceFamilyAge(): Promise<number | null> {
  try {
    if (Platform.OS === 'ios') {
      // In a native build, this would use:
      // - DeviceCheck framework to read Apple Family Sharing age
      // - Or ASAuthorizationController for Sign in with Apple (includes age range)
      // For MVP: returns null, falls back to parent attestation
      //
      // Native implementation (Swift, added during expo prebuild):
      // let store = CNContactStore()
      // Access the "me" card age if available via HealthKit DOB
      // or Apple Family Sharing child account age restriction
      return null;
    }

    if (Platform.OS === 'android') {
      // In a native build, this would use:
      // - Google Family Link API to read child account age
      // - Or Google Play Services UserProfile
      // For MVP: returns null, falls back to parent attestation
      return null;
    }

    return null;
  } catch {
    return null;
  }
}

// ── PARENT ATTESTATION ──────────────────────────────────────

export async function setParentAttestedAge(age: number): Promise<AgeProfile> {
  const deviceAge = await getDeviceFamilyAge();

  let confidence: AgeConfidence = 'medium'; // parent-only = medium
  let source: AgeSource = 'parent_attestation';

  // If device family age matches parent attestation = high confidence
  if (deviceAge !== null) {
    const parentBracket = ageToBracket(age);
    const deviceBracket = ageToBracket(deviceAge);

    if (parentBracket === deviceBracket) {
      confidence = 'high';
      source = 'combined';
    } else {
      // Mismatch — trust parent but flag for review
      console.warn(
        `[Custorian] Age mismatch: parent says ${age}, device says ${deviceAge}. Using parent attestation.`
      );
      confidence = 'medium';
    }
  }

  const profile: AgeProfile = {
    bracket: ageToBracket(age),
    exactAge: age,
    source,
    confidence,
    verifiedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(AGE_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

// ── SCHOOL DEPLOYMENT ───────────────────────────────────────

export async function setSchoolDeploymentAge(bracket: AgeBracket): Promise<AgeProfile> {
  const profile: AgeProfile = {
    bracket,
    source: 'school_deployment',
    confidence: 'high', // school confirms = high
    verifiedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(AGE_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

// ── EU DIGITAL IDENTITY WALLET (FUTURE) ─────────────────────
// The EU is building a digital identity wallet that includes age credentials.
// A child (or parent) can prove "over 13" without revealing identity.
// When this ships, Custorian will be among the first to integrate.
//
// Expected timeline: EU eIDAS 2.0 wallet pilots 2026-2027, full rollout 2028.
// Specification: https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/European+Digital+Identity+Wallet
//
// Integration approach:
// - Child presents age credential from EU wallet
// - Custorian verifies the credential cryptographically
// - No personal data stored — only "age bracket confirmed"
// - Zero-knowledge proof: proves age without revealing anything else

export async function verifyEUWalletAge(): Promise<AgeProfile | null> {
  // Not yet available — placeholder for future integration
  // When EU wallet SDK is released, this will:
  // 1. Prompt the wallet app via deep link
  // 2. Receive a signed age credential
  // 3. Verify the credential against EU trust framework
  // 4. Extract age bracket (not exact age)
  console.log('[Custorian] EU Digital Identity Wallet not yet available. Using fallback.');
  return null;
}

// ── GET CURRENT PROFILE ─────────────────────────────────────

export async function getAgeProfile(): Promise<AgeProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(AGE_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AgeProfile;
  } catch {
    return null;
  }
}

// ── AGE-DEPENDENT CONFIGURATION ─────────────────────────────

export interface AgeConfig {
  screenTimeLimitMinutes: number;
  lateNightThresholdHour: number;
  flaggedAppThresholdMinutes: number;
  interventionTone: 'gentle' | 'direct' | 'peer';
  showConsequences: boolean;
}

export function getAgeConfig(bracket: AgeBracket): AgeConfig {
  switch (bracket) {
    case '8-10':
      return {
        screenTimeLimitMinutes: 120,      // 2 hours
        lateNightThresholdHour: 20,       // 8pm
        flaggedAppThresholdMinutes: 15,   // strict on risky apps
        interventionTone: 'gentle',       // simpler language
        showConsequences: false,          // too young for consequence framing
      };
    case '11-13':
      return {
        screenTimeLimitMinutes: 180,      // 3 hours
        lateNightThresholdHour: 21,       // 9pm
        flaggedAppThresholdMinutes: 30,
        interventionTone: 'gentle',
        showConsequences: true,           // start showing real consequences
      };
    case '14-16':
      return {
        screenTimeLimitMinutes: 240,      // 4 hours
        lateNightThresholdHour: 22,       // 10pm
        flaggedAppThresholdMinutes: 60,
        interventionTone: 'direct',       // speak to them like young adults
        showConsequences: true,
      };
    case '17+':
      return {
        screenTimeLimitMinutes: 360,      // 6 hours
        lateNightThresholdHour: 23,       // 11pm
        flaggedAppThresholdMinutes: 90,
        interventionTone: 'peer',         // adult-adjacent tone
        showConsequences: true,
      };
  }
}
