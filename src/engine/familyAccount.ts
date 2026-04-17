/**
 * Family Account — Single account, multiple devices.
 *
 * How it works:
 * 1. Parent creates account (email + password) on their device
 * 2. Parent logs in with SAME credentials on child's device
 * 3. During login, parent selects role: "This is my device" or "This is my child's device"
 * 4. Supabase links all devices under one account
 * 5. Parent device shows parent view, child device shows child view
 *
 * No codes. No QR. No links. Just one login.
 * Adding multiple children: log in on each child's device, name it, done.
 */

import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNT_KEY = 'custorian_account';

export type DeviceRole = 'parent' | 'child';

export interface AccountConfig {
  email: string;
  userId: string;
  role: DeviceRole;
  deviceName: string;
  childName?: string;
  ageBracket?: string;
  childBirthday?: string;
}

/**
 * Sign up a new family account.
 */
export async function signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Sign in to an existing family account.
 */
export async function signIn(email: string, password: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true, userId: data.user?.id };
}

/**
 * Set this device's role after signing in.
 */
export async function setDeviceRole(
  role: DeviceRole,
  deviceName: string,
  childName?: string,
  ageBracket?: string,
  childBirthday?: string,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const config: AccountConfig = {
    email: session.user.email || '',
    userId: session.user.id,
    role,
    deviceName,
    childName,
    ageBracket,
    childBirthday,
  };

  // Save locally
  await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(config));

  // Register device in Supabase
  if (role === 'child') {
    await supabase.from('family_children').upsert({
      family_code: session.user.id, // Use user ID as family code
      child_name: childName || deviceName,
      child_device_id: deviceName,
      age_bracket: ageBracket || '8-10',
    }, { onConflict: 'family_code,child_device_id' });
  }

  // Register parent push token
  if (role === 'parent') {
    try {
      const { default: Notifications } = await import('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: '00a9854a-3e2d-4f1a-bc24-435811b904dc',
        });
        await supabase.from('families').upsert({
          family_code: session.user.id,
          parent_push_token: token.data,
          parent_device_id: deviceName,
        }, { onConflict: 'family_code' });
      }
    } catch {}
  }
}

/**
 * Get current account config.
 */
export async function getAccountConfig(): Promise<AccountConfig | null> {
  try {
    const data = await AsyncStorage.getItem(ACCOUNT_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Check if user is signed in.
 */
export async function isSignedIn(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Sign out and clear local config.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  await AsyncStorage.removeItem(ACCOUNT_KEY);
}

/**
 * Get all children linked to this account (for parent view).
 */
export async function getChildren(): Promise<any[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data } = await supabase
    .from('family_children')
    .select('*')
    .eq('family_code', session.user.id);
  return data || [];
}

/**
 * Get alerts for all children (for parent view).
 */
export async function getFamilyAlerts(limit: number = 100): Promise<any[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data } = await supabase
    .from('family_alerts')
    .select('*')
    .eq('family_code', session.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

/**
 * Sync an alert from child device to parent.
 */
export async function syncAlert(alert: any): Promise<void> {
  const config = await getAccountConfig();
  if (!config || config.role !== 'child') return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase.from('family_alerts').insert({
    family_code: session.user.id,
    child_device_id: config.deviceName,
    child_name: config.childName || config.deviceName,
    category: alert.category,
    severity: alert.score >= 80 ? 'critical' : alert.score >= 60 ? 'high' : alert.score >= 40 ? 'medium' : 'low',
    confidence: alert.score / 100,
    snippet: alert.snippet,
    source_app: alert.sourceApp,
    status: 'new',
  });

  // Push notification to parent
  const { data: family } = await supabase
    .from('families')
    .select('parent_push_token')
    .eq('family_code', session.user.id)
    .single();

  if (family?.parent_push_token) {
    const severity = alert.score >= 80 ? 'CRITICAL' : 'HIGH';
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: family.parent_push_token,
        title: `⚠️ ${severity}: ${alert.category}`,
        body: 'Your child may need support. Open Custorian for details.',
        sound: alert.score >= 80 ? 'default' : undefined,
      }),
    }).catch(() => {});
  }
}
