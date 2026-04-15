/**
 * Custorian Analytics — anonymous telemetry to Supabase.
 *
 * PRIVACY: No message content. No images. No child identifiers.
 * No device IDs. Only aggregate detection stats.
 * All fields are anonymised or categorical.
 */

import { supabase } from './supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Generate a random session ID per app launch (not persistent)
const sessionId = Math.random().toString(36).substring(2, 15);
const appVersion = Constants.expoConfig?.version || 'unknown';
const platform = Platform.OS;

/**
 * Log a detection event (text threat detected by risk engine)
 */
export async function logScanEvent(params: {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  language: string;
  source: string; // 'risk_engine' | 'behavior_engine' | 'content_radar'
}) {
  try {
    await supabase.from('scan_events').insert({
      category: params.category,
      severity: params.severity,
      confidence: params.confidence,
      language: params.language,
      source: params.source,
      platform,
      app_version: appVersion,
    });
  } catch (e) {
    // Silent fail — analytics should never break the app
    console.log('[Analytics] scan_event failed:', e);
  }
}

/**
 * Log a PhotoDNA scan result
 */
export async function logPhotoDnaScan(params: {
  is_match: boolean;
  response_time_ms: number;
  status_code: number;
  error?: string;
}) {
  try {
    await supabase.from('photodna_scans').insert({
      is_match: params.is_match,
      response_time_ms: params.response_time_ms,
      status_code: params.status_code,
      error: params.error || null,
      platform,
      app_version: appVersion,
    });
  } catch (e) {
    console.log('[Analytics] photodna_scan failed:', e);
  }
}

/**
 * Log an app session start
 */
export async function logSessionStart() {
  try {
    await supabase.from('app_sessions').insert({
      session_id: sessionId,
      platform,
      app_version: appVersion,
    });
  } catch (e) {
    console.log('[Analytics] session_start failed:', e);
  }
}

/**
 * Log an intervention shown to the child
 */
export async function logIntervention(params: {
  category: string;
  intervention_type: string; // 'empowerment_prompt' | 'crisis_resource' | 'block_contact'
}) {
  try {
    await supabase.from('interventions').insert({
      category: params.category,
      intervention_type: params.intervention_type,
      platform,
      app_version: appVersion,
    });
  } catch (e) {
    console.log('[Analytics] intervention failed:', e);
  }
}
