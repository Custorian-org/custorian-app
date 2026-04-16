/**
 * Screen Time Monitor — uses Apple's DeviceActivityMonitor framework
 * via the native CustorianBridge to get app usage data.
 *
 * Requires:
 * - Family Sharing enabled between parent and child Apple IDs
 * - Family Controls entitlement on the app
 * - AuthorizationCenter.shared.requestAuthorization() called on first launch
 *
 * What it provides:
 * - Time spent per app category (Social, Games, Entertainment, etc.)
 * - Total screen time per day
 * - Number of pickups
 * - Most used apps
 *
 * PRIVACY: Uses Apple's own framework. Data stays within Apple's ecosystem.
 * We only read aggregate categories, not specific app names (Apple restricts this).
 */

import { NativeModules, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { getFamilyConfig } from './familySync';

const { CustorianBridge } = NativeModules;

export interface ScreenTimeReport {
  date: string;
  totalMinutes: number;
  pickups: number;
  categories: {
    social: number;
    games: number;
    entertainment: number;
    education: number;
    productivity: number;
    other: number;
  };
  topApps: string[]; // Only available if Apple provides app tokens
}

/**
 * Request Screen Time authorization.
 * Must be called once during setup. Shows Apple's permission dialog.
 */
export async function requestScreenTimeAccess(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !CustorianBridge?.requestScreenTimeAuth) return false;
  try {
    const result = await CustorianBridge.requestScreenTimeAuth();
    return result === true;
  } catch {
    return false;
  }
}

/**
 * Get today's screen time data.
 */
export async function getTodayScreenTime(): Promise<ScreenTimeReport | null> {
  if (Platform.OS !== 'ios' || !CustorianBridge?.getScreenTimeData) return null;
  try {
    const raw = await CustorianBridge.getScreenTimeData();
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Sync screen time data to Supabase for parent dashboard.
 */
export async function syncScreenTimeToParent(childDeviceId: string, report: ScreenTimeReport): Promise<void> {
  const config = await getFamilyConfig();
  if (!config) return;

  try {
    await supabase.from('screen_time_reports').upsert({
      family_code: config.familyCode,
      child_device_id: childDeviceId,
      date: report.date,
      total_minutes: report.totalMinutes,
      pickups: report.pickups,
      categories: report.categories,
      top_apps: report.topApps,
    }, { onConflict: 'family_code,child_device_id,date' });
  } catch (e) {
    console.error('[ScreenTime] Sync failed:', e);
  }
}
