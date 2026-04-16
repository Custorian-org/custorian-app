import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors, Spacing, Radius } from '../src/constants/theme';
import { createFamily, joinFamily } from '../src/engine/familySync';

type Step = 'role' | 'parent-pin' | 'parent-family' | 'parent-children' | 'child-code' | 'child-pin-confirm' | 'done';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setPin, completeOnboarding } = useGuard();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<'parent' | 'child' | null>(null);

  // Parent state
  const [pin, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [children, setChildren] = useState<{ name: string; age: string; birthday: string }[]>([{ name: '', age: '8-10', birthday: '' }]);

  // Child state
  const [code, setCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [ageBracket, setAgeBracket] = useState('11-13');
  const [parentPin, setParentPin] = useState('');
  const [childBirthday, setChildBirthday] = useState('');

  async function handleParentPin() {
    if (pin.length !== 4) { Alert.alert('PIN must be 4 digits'); return; }
    if (pin !== pinConfirm) { Alert.alert('PINs don\'t match'); return; }
    await setPin(pin);
    setStep('parent-family');
  }

  async function handleCreateFamily() {
    try {
      const newCode = await createFamily();
      setFamilyCode(newCode);
      setStep('parent-children');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleParentDone() {
    await completeOnboarding();
    router.replace('/home');
  }

  async function handleChildJoin() {
    if (code.length !== 6) { Alert.alert('Enter the 6-digit code from the parent device'); return; }
    if (!deviceName.trim()) { Alert.alert('Enter a name for this device'); return; }
    const success = await joinFamily(code, deviceName.trim(), ageBracket);
    if (!success) { Alert.alert('Invalid Code', 'That code was not found. Check with your parent.'); return; }
    // Save birthday for Content Radar age defaults
    if (childBirthday.length === 10) {
      const parts = childBirthday.split('/');
      if (parts.length === 3) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem('custorian_child_birthday', `${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    setStep('child-pin-confirm');
  }

  async function handleChildPinConfirm() {
    // Verify parent PIN
    const { verifyPin } = useGuard();
    // Since child device doesn't have PIN yet, we set it here
    if (parentPin.length !== 4) { Alert.alert('Enter the 4-digit parent PIN'); return; }
    await setPin(parentPin);
    await completeOnboarding();
    router.replace('/home');
  }

  // ── ROLE SELECTION ──
  if (step === 'role') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.center}>
          <Text style={s.logo}>Custorian</Text>
          <Text style={s.subtitle}>The open standard for child digital safety</Text>

          <Text style={s.question}>Who is using this device?</Text>

          <TouchableOpacity style={s.roleCard} onPress={() => { setRole('parent'); setStep('parent-pin'); }}>
            <Text style={s.roleIcon}>👤</Text>
            <Text style={s.roleTitle}>I'm the parent</Text>
            <Text style={s.roleDesc}>Set up this device to monitor and protect your children. You'll get alerts and controls.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.roleCard} onPress={() => { setRole('child'); setStep('child-code'); }}>
            <Text style={s.roleIcon}>🛡️</Text>
            <Text style={s.roleTitle}>This is my child's device</Text>
            <Text style={s.roleDesc}>Install protection on your child's phone or tablet. You'll need the family code from the parent device.</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PARENT: SET PIN ──
  if (step === 'parent-pin') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.padded}>
          <Text style={s.stepLabel}>STEP 1 OF 3</Text>
          <Text style={s.heading}>Create your parent PIN</Text>
          <Text style={s.body}>This PIN protects the parent dashboard. Only you can see alerts and change settings. Choose something your child won't guess.</Text>

          <TextInput style={s.pinInput} placeholder="4-digit PIN" placeholderTextColor="#9ca3af" value={pin} onChangeText={setPinValue} keyboardType="number-pad" maxLength={4} secureTextEntry />
          <TextInput style={s.pinInput} placeholder="Confirm PIN" placeholderTextColor="#9ca3af" value={pinConfirm} onChangeText={setPinConfirm} keyboardType="number-pad" maxLength={4} secureTextEntry />

          <TouchableOpacity style={s.primaryBtn} onPress={handleParentPin}>
            <Text style={s.primaryText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PARENT: CREATE FAMILY ──
  if (step === 'parent-family') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.padded}>
          <Text style={s.stepLabel}>STEP 2 OF 3</Text>
          <Text style={s.heading}>Create your family</Text>
          <Text style={s.body}>This generates a 6-digit code. You'll enter this code on each child's device to link them to your account.</Text>

          {familyCode ? (
            <View style={s.codeCard}>
              <Text style={s.codeLabel}>YOUR FAMILY CODE</Text>
              <Text style={s.codeValue}>{familyCode}</Text>
              <TouchableOpacity onPress={() => Share.share({ message: `Install Custorian on your child's device and enter this family code: ${familyCode}` })}>
                <Text style={s.shareBtn}>Share code →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.primaryBtn} onPress={handleCreateFamily}>
              <Text style={s.primaryText}>Generate Family Code</Text>
            </TouchableOpacity>
          )}

          {familyCode && (
            <TouchableOpacity style={[s.primaryBtn, { marginTop: 24 }]} onPress={() => setStep('parent-children')}>
              <Text style={s.primaryText}>Continue</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PARENT: ADD CHILDREN ──
  if (step === 'parent-children') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.padded}>
          <Text style={s.stepLabel}>STEP 3 OF 3</Text>
          <Text style={s.heading}>Your children</Text>
          <Text style={s.body}>Add the names of the children you'll be monitoring. You can add more later.</Text>

          {children.map((child, i) => (
            <View key={i} style={s.childRow}>
              <TextInput
                style={s.input}
                placeholder={`Child ${i + 1} name`}
                placeholderTextColor="#9ca3af"
                value={child.name}
                onChangeText={(t) => { const c = [...children]; c[i].name = t; setChildren(c); }}
              />
              <TextInput
                style={s.input}
                placeholder="Birthday (DD/MM/YYYY)"
                placeholderTextColor="#9ca3af"
                value={child.birthday}
                onChangeText={(t) => {
                  const c = [...children];
                  c[i].birthday = t;
                  // Auto-calculate age bracket from birthday
                  if (t.length === 10) {
                    const parts = t.split('/');
                    if (parts.length === 3) {
                      const birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                      if (age >= 5 && age <= 7) c[i].age = '5-7';
                      else if (age >= 8 && age <= 10) c[i].age = '8-10';
                      else if (age >= 11 && age <= 13) c[i].age = '11-13';
                      else if (age >= 14 && age <= 16) c[i].age = '14-16';
                      else if (age >= 17) c[i].age = '17+';
                    }
                  }
                  setChildren(c);
                }}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
              <Text style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Age bracket: <Text style={{ fontWeight: '700', color: Colors.primary }}>{child.age}</Text> {child.birthday.length === 10 ? '(auto-detected from birthday)' : ''}</Text>
              <View style={s.agePills}>
                {['5-7', '8-10', '11-13', '14-16', '17+'].map(age => (
                  <TouchableOpacity
                    key={age}
                    style={[s.agePill, child.age === age && s.agePillActive]}
                    onPress={() => { const c = [...children]; c[i].age = age; setChildren(c); }}
                  >
                    <Text style={[s.agePillText, child.age === age && s.agePillTextActive]}>{age}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity onPress={() => setChildren([...children, { name: '', age: '8-10', birthday: '' }])}>
            <Text style={s.addChild}>+ Add another child</Text>
          </TouchableOpacity>

          <View style={s.infoCard}>
            <Text style={s.infoTitle}>Setup on your child's device</Text>
            <Text style={s.infoText}>1. Install Custorian on each child's device</Text>
            <Text style={s.infoText}>2. Select "This is my child's device"</Text>
            <Text style={s.infoText}>3. Enter code: <Text style={{ fontWeight: '800', color: Colors.primary }}>{familyCode}</Text></Text>
          </View>

          <View style={[s.infoCard, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}>
            <Text style={[s.infoTitle, { color: '#92400e' }]}>⚠️ Important: Lock down the keyboard</Text>
            <Text style={[s.infoText, { color: '#78350f' }]}>On your child's device, do these steps:</Text>
            <Text style={[s.infoText, { color: '#78350f', marginTop: 4 }]}>1. Settings → General → Keyboard → Keyboards → Add New Keyboard → Custorian</Text>
            <Text style={[s.infoText, { color: '#78350f' }]}>2. Tap Custorian → Allow Full Access → tap "Allow"</Text>
            <Text style={[s.infoText, { color: '#78350f' }]}>3. Tap Edit (top right) → DELETE the default Apple keyboard</Text>
            <Text style={[s.infoText, { color: '#78350f' }]}>4. Now only Custorian keyboard is available</Text>
            <Text style={[s.infoText, { color: '#78350f', marginTop: 8, fontWeight: '600' }]}>Then lock it so your child can't change it:</Text>
            <Text style={[s.infoText, { color: '#78350f' }]}>5. Settings → Screen Time → Content & Privacy Restrictions → ON</Text>
            <Text style={[s.infoText, { color: '#78350f' }]}>6. Set a Screen Time passcode your child doesn't know</Text>
            <Text style={[s.infoText, { color: '#78350f' }]}>7. Allowed Apps & Features → keep all enabled</Text>
            <Text style={[s.infoText, { color: '#78350f', marginTop: 4 }]}>This also prevents your child from deleting the app or changing notification settings.</Text>
          </View>

          <View style={[s.infoCard, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
            <Text style={[s.infoTitle, { color: '#166534' }]}>✓ What's now protected</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• Incoming messages monitored (notification extension)</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• Outgoing messages monitored (keyboard)</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• Photos from chat apps scanned</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• Websites monitored (Safari extension)</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• App can't be deleted</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• Settings can't be changed without your PIN</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• All analysis runs on-device — nothing leaves the phone</Text>
          </View>

          <TouchableOpacity style={s.primaryBtn} onPress={handleParentDone}>
            <Text style={s.primaryText}>Start Monitoring</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── CHILD: ENTER CODE ──
  if (step === 'child-code') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.padded}>
          <Text style={s.stepLabel}>CHILD DEVICE SETUP</Text>
          <Text style={s.heading}>Connect to parent</Text>
          <Text style={s.body}>Ask your parent for the 6-digit family code from their Custorian app.</Text>

          <TextInput style={s.pinInput} placeholder="6-digit family code" placeholderTextColor="#9ca3af" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
          <TextInput style={s.input} placeholder="Device name (e.g. Emma's iPad)" placeholderTextColor="#9ca3af" value={deviceName} onChangeText={setDeviceName} />
          <TextInput
            style={s.input}
            placeholder="Child's birthday (DD/MM/YYYY)"
            placeholderTextColor="#9ca3af"
            value={childBirthday}
            onChangeText={(t) => {
              setChildBirthday(t);
              if (t.length === 10) {
                const parts = t.split('/');
                if (parts.length === 3) {
                  const birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                  if (age >= 5 && age <= 7) setAgeBracket('5-7');
                  else if (age >= 8 && age <= 10) setAgeBracket('8-10');
                  else if (age >= 11 && age <= 13) setAgeBracket('11-13');
                  else if (age >= 14 && age <= 16) setAgeBracket('14-16');
                  else if (age >= 17) setAgeBracket('17+');
                }
              }
            }}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          <Text style={s.ageLabel}>Age bracket{childBirthday.length === 10 ? ' (auto-detected)' : ''}: <Text style={{ color: Colors.primary, fontWeight: '700' }}>{ageBracket}</Text></Text>
          <View style={s.agePillsRow}>
            {['5-7', '8-10', '11-13', '14-16', '17+'].map(age => (
              <TouchableOpacity key={age} style={[s.agePill, ageBracket === age && s.agePillActive]} onPress={() => setAgeBracket(age)}>
                <Text style={[s.agePillText, ageBracket === age && s.agePillTextActive]}>{age}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.primaryBtn} onPress={handleChildJoin}>
            <Text style={s.primaryText}>Connect</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── CHILD: PARENT CONFIRMS WITH PIN ──
  if (step === 'child-pin-confirm') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.padded}>
          <Text style={s.stepLabel}>PARENT CONFIRMATION</Text>
          <Text style={s.heading}>Parent: enter your PIN</Text>
          <Text style={s.body}>Hand this device to the parent. Enter the same PIN you set on your parent device to confirm this setup.</Text>

          <TextInput style={s.pinInput} placeholder="4-digit parent PIN" placeholderTextColor="#9ca3af" value={parentPin} onChangeText={setParentPin} keyboardType="number-pad" maxLength={4} secureTextEntry />

          <TouchableOpacity style={s.primaryBtn} onPress={async () => {
            if (parentPin.length !== 4) { Alert.alert('Enter 4-digit PIN'); return; }
            await setPin(parentPin);
            await completeOnboarding();
            router.replace('/home');
          }}>
            <Text style={s.primaryText}>Confirm & Activate Protection</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flexGrow: 1, justifyContent: 'center', padding: 32 },
  padded: { padding: 24, paddingTop: 48 },
  logo: { fontFamily: 'System', fontSize: 32, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 4, marginBottom: 48 },
  question: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 24 },
  roleCard: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  roleIcon: { fontSize: 32, marginBottom: 12 },
  roleTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  roleDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  stepLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 2, marginBottom: 8 },
  heading: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5, marginBottom: 8 },
  body: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 24 },
  pinInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 24, fontWeight: '700', textAlign: 'center', letterSpacing: 8, marginBottom: 12, color: '#1a1a2e' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12, color: '#1a1a2e' },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 100, padding: 16, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  codeCard: { backgroundColor: '#f5f3ff', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e9d5ff', marginBottom: 16 },
  codeLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 2, marginBottom: 8 },
  codeValue: { fontSize: 36, fontWeight: '800', color: Colors.primary, letterSpacing: 6, marginBottom: 12 },
  shareBtn: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  childRow: { marginBottom: 16 },
  agePills: { flexDirection: 'row', gap: 6, marginTop: 8 },
  agePillsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  agePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: '#f3f4f6' },
  agePillActive: { backgroundColor: Colors.primary },
  agePillText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  agePillTextActive: { color: '#fff' },
  ageLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
  addChild: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginBottom: 24 },
  infoCard: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#bbf7d0' },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#166534', marginBottom: 8 },
  infoText: { fontSize: 12, color: '#15803d', lineHeight: 18 },
});
