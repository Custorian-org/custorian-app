import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';

/**
 * Offline banner — shows when device can't reach the slang update endpoint.
 * Detection still works (on-device) but slang updates are paused.
 */

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    checkConnection();
    loadLastUpdate();
    const interval = setInterval(checkConnection, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  async function checkConnection() {
    try {
      const response = await fetch('https://custorian.org', { method: 'HEAD' });
      setIsOffline(!response.ok);
    } catch {
      setIsOffline(true);
    }
  }

  async function loadLastUpdate() {
    const ts = await AsyncStorage.getItem('last_slang_update');
    if (ts) {
      const d = new Date(ts);
      const diff = Date.now() - d.getTime();
      if (diff < 3600000) setLastUpdate('< 1 hour ago');
      else if (diff < 86400000) setLastUpdate(`${Math.floor(diff / 3600000)}h ago`);
      else setLastUpdate(`${Math.floor(diff / 86400000)}d ago`);
    }
  }

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Offline — detection active, slang updates paused</Text>
      {lastUpdate ? <Text style={styles.sub}>Last updated: {lastUpdate}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
  },
  text: { fontSize: 11, fontWeight: '600', color: '#92400e' },
  sub: { fontSize: 10, color: '#b45309' },
});
