import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/constants/theme';
import {
  createFamily, joinFamily, getFamilyConfig, leaveFamily,
  fetchFamilyChildren, FamilyConfig,
} from '../src/engine/familySync';

export default function FamilySetupScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<FamilyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [childName, setChildName] = useState('');
  const [ageBracket, setAgeBracket] = useState('11-13');
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    const c = await getFamilyConfig();
    setConfig(c);
    if (c?.role === 'parent') {
      const kids = await fetchFamilyChildren();
      setChildren(kids);
    }
    setLoading(false);
  }

  async function handleCreateFamily() {
    setLoading(true);
    try {
      const newCode = await createFamily();
      await loadConfig();
      Alert.alert(
        'Family Created',
        `Your family code is: ${newCode}\n\nEnter this code on your child's device to link it.`,
        [
          { text: 'Copy & Share', onPress: () => Share.share({ message: `Install Custorian on your child's device and enter this family code: ${newCode}` }) },
          { text: 'OK' },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create family');
    }
    setLoading(false);
  }

  async function handleJoinFamily() {
    if (code.length !== 6) { Alert.alert('Invalid Code', 'Enter the 6-digit code from the parent device'); return; }
    if (!childName.trim()) { Alert.alert('Name Required', "Enter a name for this device (e.g. Emma's iPhone)"); return; }
    setLoading(true);
    const success = await joinFamily(code, childName.trim(), ageBracket);
    if (success) {
      await loadConfig();
      Alert.alert('Connected!', 'This device is now linked to the parent device. Alerts will be sent to your parent.');
    } else {
      Alert.alert('Invalid Code', 'That family code was not found. Check with your parent.');
    }
    setLoading(false);
  }

  async function handleLeave() {
    Alert.alert('Leave Family?', 'This will disconnect this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => { await leaveFamily(); await loadConfig(); } },
    ]);
  }

  if (loading) return <SafeAreaView style={s.container}><Text style={s.loading}>Loading...</Text></SafeAreaView>;

  // Connected state
  if (config && config.role !== 'none') {
    return (
      <SafeAreaView style={s.container}>
        <ScrollView>
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
            <Text style={s.title}>Family Connected</Text>
          </View>

          <View style={s.card}>
            <Text style={s.label}>DEVICE ROLE</Text>
            <Text style={s.value}>{config.role === 'parent' ? '👤 Parent Device' : '🧒 Child Device'}</Text>
          </View>

          <View style={s.card}>
            <Text style={s.label}>FAMILY CODE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={s.code}>{config.familyCode}</Text>
              <TouchableOpacity onPress={() => Share.share({ message: `Custorian family code: ${config.familyCode}` })}>
                <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {config.role === 'parent' && (
            <View style={s.card}>
              <Text style={s.label}>LINKED CHILDREN</Text>
              {children.length === 0 ? (
                <Text style={s.empty}>No children linked yet. Enter the code on your child's device.</Text>
              ) : children.map((c, i) => (
                <View key={i} style={s.childRow}>
                  <Text style={s.childName}>{c.child_name}</Text>
                  <Text style={s.childAge}>Age {c.age_bracket}</Text>
                </View>
              ))}
            </View>
          )}

          {config.role === 'parent' && (
            <View style={s.card}>
              <Text style={s.label}>HOW IT WORKS</Text>
              <Text style={s.helpText}>When a threat is detected on your child's device, you'll receive a push notification on this phone. Open the app to see the full alert dashboard.</Text>
            </View>
          )}

          {config.role === 'child' && (
            <View style={s.card}>
              <Text style={s.label}>HOW IT WORKS</Text>
              <Text style={s.helpText}>Custorian runs in the background and watches for online threats. If something concerning is detected, you'll see a helpful message and your parent will be notified.</Text>
            </View>
          )}

          <View style={{ padding: Spacing.lg }}>
            <TouchableOpacity style={s.dangerBtn} onPress={handleLeave}>
              <Text style={s.dangerText}>Disconnect from Family</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Setup state
  return (
    <SafeAreaView style={s.container}>
      <ScrollView>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Family Setup</Text>
          <Text style={s.subtitle}>Connect parent and child devices</Text>
        </View>

        <View style={s.section}>
          <View style={s.roleCard}>
            <Text style={s.roleIcon}>👤</Text>
            <Text style={s.roleTitle}>I'm the parent</Text>
            <Text style={s.roleDesc}>Set up this phone as the parent device. You'll get a 6-digit code to enter on your child's device.</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={handleCreateFamily}>
              <Text style={s.primaryText}>Create Family</Text>
            </TouchableOpacity>
          </View>

          <View style={s.divider}><View style={s.divLine} /><Text style={s.divText}>OR</Text><View style={s.divLine} /></View>

          <View style={s.roleCard}>
            <Text style={s.roleIcon}>🧒</Text>
            <Text style={s.roleTitle}>This is my child's device</Text>
            <Text style={s.roleDesc}>Enter the 6-digit code from the parent device.</Text>

            <TextInput style={s.input} placeholder="6-digit family code" placeholderTextColor="#9ca3af" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
            <TextInput style={s.input} placeholder="Device name (e.g. Emma's iPhone)" placeholderTextColor="#9ca3af" value={childName} onChangeText={setChildName} />

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8 }}>Age bracket</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['8-10', '11-13', '14-16', '17+'].map(age => (
                <TouchableOpacity key={age} style={[s.pill, ageBracket === age && s.pillActive]} onPress={() => setAgeBracket(age)}>
                  <Text style={[s.pillText, ageBracket === age && s.pillTextActive]}>{age}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.primaryBtn} onPress={handleJoinFamily}>
              <Text style={s.primaryText}>Connect to Parent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loading: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  back: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  roleCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  roleIcon: { fontSize: 32, marginBottom: 12 },
  roleTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  roleDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 16 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12, color: '#1a1a2e' },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 100, padding: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dangerBtn: { borderWidth: 1, borderColor: '#ef444440', borderRadius: 100, padding: 14, alignItems: 'center' },
  dangerText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  divider: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  divLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  divText: { marginHorizontal: 16, fontSize: 12, fontWeight: '600', color: '#9ca3af' },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 12, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  label: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.5, marginBottom: 6 },
  value: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  code: { fontSize: 28, fontWeight: '800', color: Colors.primary, letterSpacing: 4 },
  childRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  childName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  childAge: { fontSize: 12, color: '#6b7280' },
  empty: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },
  helpText: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: '#f3f4f6' },
  pillActive: { backgroundColor: Colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  pillTextActive: { color: '#fff' },
});
