import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../constants/theme';
import { getFamilyConfig } from '../engine/familySync';
import AsyncStorage from '@react-native-async-storage/async-storage';

const parentTabs = [
  { route: '/home', label: 'Home', icon: '🏠' },
  { route: '/content-radar', label: 'Radar', icon: '📡' },
  { route: '/dashboard', label: 'Alerts', icon: '🔔' },
  { route: '/settings', label: 'Settings', icon: '⚙️' },
];

const childTabs = [
  { route: '/home', label: 'Home', icon: '🛡️' },
  { route: '/content-radar', label: 'Radar', icon: '📡' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isChild, setIsChild] = useState(false);

  useEffect(() => {
    getFamilyConfig().then(config => {
      if (config?.role === 'child') setIsChild(true);
    });
  }, []);

  const tabs = isChild ? childTabs : parentTabs;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = pathname === tab.route || (tab.route === '/home' && pathname === '/');
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(tab.route as any);
            }}
            activeOpacity={0.6}
          >
            <Text style={[styles.icon, active && styles.iconActive]}>{tab.icon}</Text>
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
  icon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.4,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMute,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: Colors.accent,
  },
});
