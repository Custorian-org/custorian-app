import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../constants/theme';

// 3 tabs only (Vance: remove Settings, it's not daily-use)
const tabs = [
  { route: '/home', label: 'Home' },
  { route: '/content-radar', label: 'Radar' },
  { route: '/dashboard', label: 'Alerts' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = pathname === tab.route || (tab.route === '/home' && pathname === '/');
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(tab.route as any);
            }}
            activeOpacity={0.6}
          >
            <View style={[styles.indicator, active && styles.indicatorActive]} />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 28,
    paddingTop: 10,
    // Shadow (Chop Dawg)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  indicatorActive: {
    backgroundColor: Colors.accent,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMute,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: Colors.accent,
  },
});
