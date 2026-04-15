/**
 * Family Sync — Parent-Child Device Pairing + Alert Sync
 *
 * How it works:
 * 1. Parent installs app → chooses "I'm the parent" → gets a 6-digit family code
 * 2. Parent installs app on child's device → enters the family code
 * 3. Child's device sends alerts to Supabase family_alerts table
 * 4. Parent's device polls for new alerts + receives push notifications
 *
 * Privacy: No message content is synced. Only category, severity, pattern name.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { RiskAlert } from './riskEngine';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const FAMILY_KEY = 'custorian_family';

export type DeviceRole = 'parent' | 'child' | 'none';

export interface FamilyConfig {
  role: DeviceRole;
  familyCode: string;
  deviceId: string;
  childName?: string; // only for child devices
  ageBracket?: string;
}

// ── SETUP ────────────────────────────────────────

/**
 * Generate a random 6-digit family code.
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a random device ID (persists per device).
 */
function generateDeviceId(): string {
  return `dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Parent: Create a new family. Returns the 6-digit code to share with child.
 */
export async function createFamily(): Promise<string> {
  const code = generateCode();
  const deviceId = generateDeviceId();

  // Register push token
  const pushToken = await registerForPush();

  // Save to Supabase
  await supabase.from('families').insert({
    family_code: code,
    parent_push_token: pushToken,
    parent_device_id: deviceId,
  });

  // Save locally
  const config: FamilyConfig = { role: 'parent', familyCode: code, deviceId };
  await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(config));

  return code;
}

/**
 * Child: Join a family using the 6-digit code.
 */
export async function joinFamily(code: string, childName: string, ageBracket: string): Promise<boolean> {
  // Verify code exists
  const { data } = await supabase.from('families').select('*').eq('family_code', code).single();
  if (!data) return false;

  const deviceId = generateDeviceId();

  // Register child device
  await supabase.from('family_children').insert({
    family_code: code,
    child_name: childName,
    child_device_id: deviceId,
    age_bracket: ageBracket,
  });

  // Save locally
  const config: FamilyConfig = { role: 'child', familyCode: code, deviceId, childName, ageBracket };
  await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(config));

  return true;
}

/**
 * Get current family config.
 */
export async function getFamilyConfig(): Promise<FamilyConfig | null> {
  try {
    const data = await AsyncStorage.getItem(FAMILY_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Leave family / reset.
 */
export async function leaveFamily(): Promise<void> {
  await AsyncStorage.removeItem(FAMILY_KEY);
}

// ── ALERT SYNC (Child → Supabase → Parent) ──────

/**
 * Child device: Push an alert to the family.
 */
export async function syncAlertToFamily(alert: RiskAlert): Promise<void> {
  const config = await getFamilyConfig();
  if (!config || config.role !== 'child') return;

  try {
    // Insert alert to Supabase
    await supabase.from('family_alerts').insert({
      family_code: config.familyCode,
      child_device_id: config.deviceId,
      child_name: config.childName || 'Child',
      category: alert.category,
      severity: alert.score >= 80 ? 'critical' : alert.score >= 60 ? 'high' : alert.score >= 40 ? 'medium' : 'low',
      confidence: alert.score / 100,
      snippet: alert.snippet,
      source_app: alert.sourceApp,
      intervention_shown: alert.score >= 50,
      is_self_report: alert.sourceApp === 'Self-Report',
      status: 'new',
    });

    // Send push notification to parent
    await notifyParent(config.familyCode, alert);
  } catch (e) {
    console.error('[FamilySync] Failed to sync alert:', e);
  }
}

/**
 * Parent device: Fetch all alerts for the family.
 */
export async function fetchFamilyAlerts(): Promise<any[]> {
  const config = await getFamilyConfig();
  if (!config || config.role !== 'parent') return [];

  try {
    const { data } = await supabase
      .from('family_alerts')
      .select('*')
      .eq('family_code', config.familyCode)
      .order('created_at', { ascending: false })
      .limit(200);
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Parent device: Fetch linked children.
 */
export async function fetchFamilyChildren(): Promise<any[]> {
  const config = await getFamilyConfig();
  if (!config || config.role !== 'parent') return [];

  try {
    const { data } = await supabase
      .from('family_children')
      .select('*')
      .eq('family_code', config.familyCode);
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Parent device: Update alert status (reviewed, resolved, etc.)
 */
export async function updateAlertStatus(alertId: number, status: string, action?: string, notes?: string): Promise<void> {
  await supabase.from('family_alerts').update({
    status,
    parent_action: action,
    parent_notes: notes,
  }).eq('id', alertId);
}

/**
 * Parent device: Get count of unreviewed alerts.
 */
export async function getUnreviewedCount(): Promise<number> {
  const config = await getFamilyConfig();
  if (!config || config.role !== 'parent') return 0;

  try {
    const { count } = await supabase
      .from('family_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('family_code', config.familyCode)
      .eq('status', 'new');
    return count || 0;
  } catch {
    return 0;
  }
}

// ── PUSH NOTIFICATIONS ──────────────────────────

async function registerForPush(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '00a9854a-3e2d-4f1a-bc24-435811b904dc',
    });

    return token.data;
  } catch {
    return null;
  }
}

/**
 * Send push notification to the parent device via Expo Push Service.
 */
async function notifyParent(familyCode: string, alert: RiskAlert): Promise<void> {
  try {
    // Get parent's push token
    const { data } = await supabase
      .from('families')
      .select('parent_push_token')
      .eq('family_code', familyCode)
      .single();

    if (!data?.parent_push_token) return;

    const severityLabel = alert.score >= 80 ? 'CRITICAL' : alert.score >= 60 ? 'HIGH' : 'MEDIUM';
    const categoryLabels: Record<string, string> = {
      grooming: 'Grooming detected',
      bullying: 'Bullying detected',
      selfHarm: 'Self-harm signal',
      violence: 'Violence concern',
      contentWellness: 'Content alert',
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.parent_push_token,
        title: `⚠️ ${severityLabel}: ${categoryLabels[alert.category] || alert.category}`,
        body: alert.snippet.substring(0, 100),
        sound: alert.score >= 80 ? 'default' : undefined,
        priority: alert.score >= 80 ? 'high' : 'default',
        data: {
          type: 'custorian_alert',
          alertId: alert.id,
          category: alert.category,
          severity: severityLabel,
        },
      }),
    });
  } catch (e) {
    console.error('[FamilySync] Push notification failed:', e);
  }
}

// ── NOTIFICATION HANDLERS ───────────────────────

/**
 * Configure notification handling for the app.
 * Call this once in the app root.
 */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
