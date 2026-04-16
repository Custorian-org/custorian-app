/**
 * Digital Activity Profile — builds a picture of the child's online life
 * from notification data + keyboard data + Supabase analytics.
 *
 * This does NOT read other apps' data (iOS prevents that).
 * Instead, it aggregates what we CAN observe:
 * - Which apps send notifications (and how many)
 * - When the child is most active on each platform
 * - Threat patterns per platform
 * - Overall digital wellness indicators
 *
 * All data is anonymous — no message content stored.
 */

import { supabase } from '../lib/supabase';
import { getFamilyConfig } from './familySync';

export interface AppActivity {
  appName: string;
  notificationCount: number;
  threatCount: number;
  threatCategories: string[];
  peakHours: string; // e.g. "18:00-22:00"
  riskLevel: 'safe' | 'moderate' | 'high';
  lastSeen: string;
}

export interface ActivityProfile {
  childName: string;
  childDeviceId: string;
  period: string; // '7d' | '30d'
  totalNotifications: number;
  totalThreats: number;
  appBreakdown: AppActivity[];
  peakActivityTime: string;
  mostActiveApp: string;
  riskiestApp: string;
  dailyAvgNotifications: number;
  weekdayVsWeekend: { weekday: number; weekend: number };
  insights: string[];
}

/**
 * Build an activity profile from Supabase data.
 * Parent device only.
 */
export async function buildActivityProfile(childDeviceId: string, periodDays: number = 7): Promise<ActivityProfile | null> {
  const config = await getFamilyConfig();
  if (!config || config.role !== 'parent') return null;

  const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Fetch alerts for this child
    const { data: alerts } = await supabase
      .from('family_alerts')
      .select('*')
      .eq('family_code', config.familyCode)
      .eq('child_device_id', childDeviceId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });

    if (!alerts) return null;

    // Get child name
    const { data: children } = await supabase
      .from('family_children')
      .select('child_name')
      .eq('child_device_id', childDeviceId)
      .single();

    // Aggregate by app
    const appMap: Record<string, { count: number; threats: number; categories: Set<string>; hours: number[]; lastSeen: string }> = {};

    alerts.forEach((a: any) => {
      const app = a.source_app || 'Unknown';
      if (!appMap[app]) {
        appMap[app] = { count: 0, threats: 0, categories: new Set(), hours: [], lastSeen: a.created_at };
      }
      appMap[app].count++;
      if (a.confidence >= 0.5) {
        appMap[app].threats++;
        appMap[app].categories.add(a.category);
      }
      const hour = new Date(a.created_at).getHours();
      appMap[app].hours.push(hour);
      if (a.created_at > appMap[app].lastSeen) appMap[app].lastSeen = a.created_at;
    });

    // Build app activity list
    const appBreakdown: AppActivity[] = Object.entries(appMap)
      .map(([appName, data]) => {
        const peakHour = mode(data.hours);
        return {
          appName,
          notificationCount: data.count,
          threatCount: data.threats,
          threatCategories: Array.from(data.categories),
          peakHours: `${peakHour}:00-${peakHour + 2}:00`,
          riskLevel: data.threats >= 5 ? 'high' as const : data.threats >= 2 ? 'moderate' as const : 'safe' as const,
          lastSeen: data.lastSeen,
        };
      })
      .sort((a, b) => b.notificationCount - a.notificationCount);

    // Overall stats
    const allHours = alerts.map((a: any) => new Date(a.created_at).getHours());
    const peakHour = mode(allHours);

    const weekdayCounts = alerts.filter((a: any) => {
      const day = new Date(a.created_at).getDay();
      return day >= 1 && day <= 5;
    }).length;
    const weekendCounts = alerts.length - weekdayCounts;

    const mostActive = appBreakdown[0]?.appName || 'None';
    const riskiest = [...appBreakdown].sort((a, b) => b.threatCount - a.threatCount)[0]?.appName || 'None';

    // Generate insights
    const insights: string[] = [];

    if (appBreakdown.some(a => a.riskLevel === 'high')) {
      insights.push(`⚠️ ${riskiest} has high threat activity — review alerts for this platform.`);
    }

    if (peakHour >= 22 || peakHour <= 5) {
      insights.push(`🌙 Most activity happens late at night (${peakHour}:00-${peakHour + 2}:00). Consider a bedtime for devices.`);
    }

    if (weekendCounts > weekdayCounts * 1.5) {
      insights.push(`📅 Significantly more activity on weekends. This is normal but worth monitoring.`);
    }

    const topApp = appBreakdown[0];
    if (topApp && topApp.notificationCount > 20) {
      insights.push(`📱 ${topApp.appName} is the most active platform with ${topApp.notificationCount} notifications this period.`);
    }

    if (alerts.some((a: any) => a.is_self_report)) {
      insights.push(`🆘 Your child self-reported at least once. They're reaching out — talk to them.`);
    }

    if (alerts.length === 0) {
      insights.push(`✅ No alerts this period. Either activity is low or everything is safe.`);
    }

    return {
      childName: children?.child_name || 'Child',
      childDeviceId,
      period: `${periodDays}d`,
      totalNotifications: alerts.length,
      totalThreats: alerts.filter((a: any) => a.confidence >= 0.5).length,
      appBreakdown,
      peakActivityTime: `${peakHour}:00-${peakHour + 2}:00`,
      mostActiveApp: mostActive,
      riskiestApp: riskiest,
      dailyAvgNotifications: Math.round(alerts.length / periodDays),
      weekdayVsWeekend: { weekday: weekdayCounts, weekend: weekendCounts },
      insights,
    };
  } catch (e) {
    console.error('[ActivityProfile] Error:', e);
    return null;
  }
}

function mode(arr: number[]): number {
  if (arr.length === 0) return 12;
  const freq: Record<number, number> = {};
  arr.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
  return Number(Object.entries(freq).sort(([, a], [, b]) => b - a)[0][0]);
}

/**
 * Get a list of platforms the child uses (inferred from notification data).
 */
export async function getChildPlatforms(childDeviceId: string): Promise<string[]> {
  const config = await getFamilyConfig();
  if (!config || config.role !== 'parent') return [];

  try {
    const { data } = await supabase
      .from('family_alerts')
      .select('source_app')
      .eq('family_code', config.familyCode)
      .eq('child_device_id', childDeviceId);

    if (!data) return [];
    const apps = new Set(data.map((a: any) => a.source_app).filter(Boolean));
    return Array.from(apps);
  } catch {
    return [];
  }
}
