/**
 * School Sharing — opt-in anonymised alert data to school counsellor.
 *
 * Framework reference: CS-PR.1 (Parental Visibility), Institutional Intelligence layer
 *
 * PRIVACY:
 * - Requires explicit parental opt-in
 * - Only shares: category, severity, timestamp, age bracket
 * - NEVER shares: message content, contact info, child name, device ID
 * - Parent can revoke at any time
 * - Data goes to Supabase where school dashboard reads it
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { RiskAlert } from './riskEngine';

const SCHOOL_SHARING_KEY = 'custorian_school_sharing';

export interface SchoolSharingConfig {
  enabled: boolean;
  schoolId: string;      // School's Custorian institution ID
  schoolName: string;
  ageBracket: string;    // '8-10' | '11-13' | '14-16' | '17+'
  consentTimestamp: string;
  consentedBy: string;   // 'parent' — always
}

/**
 * Enable school sharing (requires parent action).
 */
export async function enableSchoolSharing(config: Omit<SchoolSharingConfig, 'enabled' | 'consentTimestamp' | 'consentedBy'>): Promise<void> {
  const full: SchoolSharingConfig = {
    ...config,
    enabled: true,
    consentTimestamp: new Date().toISOString(),
    consentedBy: 'parent',
  };
  await AsyncStorage.setItem(SCHOOL_SHARING_KEY, JSON.stringify(full));
}

/**
 * Disable school sharing (parent can revoke any time).
 */
export async function disableSchoolSharing(): Promise<void> {
  await AsyncStorage.removeItem(SCHOOL_SHARING_KEY);
}

/**
 * Get current sharing config.
 */
export async function getSchoolSharingConfig(): Promise<SchoolSharingConfig | null> {
  try {
    const data = await AsyncStorage.getItem(SCHOOL_SHARING_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Share an anonymised alert with the school.
 * Only called if sharing is enabled.
 * Only sends: category, severity, age bracket, timestamp.
 */
export async function shareAlertWithSchool(alert: RiskAlert): Promise<boolean> {
  const config = await getSchoolSharingConfig();
  if (!config || !config.enabled) return false;

  try {
    const { error } = await supabase.from('school_alerts').insert({
      school_id: config.schoolId,
      category: alert.category,
      severity: alert.score >= 80 ? 'critical' : alert.score >= 60 ? 'high' : alert.score >= 40 ? 'medium' : 'low',
      age_bracket: config.ageBracket,
      timestamp: alert.timestamp,
      // NO message content. NO child identifier. NO contact info.
    });

    if (error) {
      console.error('[Custorian] School sharing failed:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Custorian] School sharing error:', e);
    return false;
  }
}
