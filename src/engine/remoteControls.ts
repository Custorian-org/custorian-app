/**
 * Remote Parental Controls — parent controls child's device via Supabase
 *
 * Parent's phone writes settings → Supabase → child's phone polls and applies.
 * Controls: monitoring on/off, screen time, content filtering, contact blocking.
 */

import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFamilyConfig } from './familySync';

export interface RemoteSettings {
  monitoring_active: boolean;
  screen_time_limit_minutes: number;
  bedtime_start: string; // "21:00"
  bedtime_end: string;   // "07:00"
  block_unknown_contacts: boolean;
  explicit_content_filter: boolean;
  break_reminders: boolean;
  break_interval_minutes: number;
  updated_at: string;
  updated_by: string; // parent device ID
}

const DEFAULT_SETTINGS: RemoteSettings = {
  monitoring_active: true,
  screen_time_limit_minutes: 180,
  bedtime_start: '21:00',
  bedtime_end: '07:00',
  block_unknown_contacts: true,
  explicit_content_filter: true,
  break_reminders: true,
  break_interval_minutes: 30,
  updated_at: new Date().toISOString(),
  updated_by: '',
};

/**
 * Parent: Push settings to Supabase for a child device.
 */
export async function pushSettings(childDeviceId: string, settings: Partial<RemoteSettings>): Promise<boolean> {
  const config = await getFamilyConfig();
  if (!config || config.role !== 'parent') return false;

  const full = {
    ...DEFAULT_SETTINGS,
    ...settings,
    updated_at: new Date().toISOString(),
    updated_by: config.deviceId,
  };

  try {
    // Upsert — create or update
    const { error } = await supabase.from('remote_settings').upsert({
      family_code: config.familyCode,
      child_device_id: childDeviceId,
      settings: full,
    }, { onConflict: 'family_code,child_device_id' });

    if (error) { console.error('[RemoteControls] Push failed:', error); return false; }
    return true;
  } catch (e) {
    console.error('[RemoteControls] Push error:', e);
    return false;
  }
}

/**
 * Child: Pull latest settings from Supabase.
 * Called on app start and periodically.
 */
export async function pullSettings(): Promise<RemoteSettings | null> {
  const config = await getFamilyConfig();
  if (!config || config.role !== 'child') return null;

  try {
    const { data } = await supabase
      .from('remote_settings')
      .select('settings')
      .eq('family_code', config.familyCode)
      .eq('child_device_id', config.deviceId)
      .single();

    if (data?.settings) {
      // Cache locally for offline access
      await AsyncStorage.setItem('custorian_remote_settings', JSON.stringify(data.settings));
      return data.settings as RemoteSettings;
    }
    return null;
  } catch {
    // Fallback to cached
    try {
      const cached = await AsyncStorage.getItem('custorian_remote_settings');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
}

/**
 * Parent: Get current settings for a child device.
 */
export async function getChildSettings(childDeviceId: string): Promise<RemoteSettings> {
  const config = await getFamilyConfig();
  if (!config || config.role !== 'parent') return DEFAULT_SETTINGS;

  try {
    const { data } = await supabase
      .from('remote_settings')
      .select('settings')
      .eq('family_code', config.familyCode)
      .eq('child_device_id', childDeviceId)
      .single();

    return (data?.settings as RemoteSettings) || DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get default settings.
 */
export function getDefaults(): RemoteSettings {
  return { ...DEFAULT_SETTINGS };
}
