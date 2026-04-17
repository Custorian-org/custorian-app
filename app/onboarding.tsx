import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGuard } from '../src/contexts/GuardContext';
import { Colors, Spacing, Radius } from '../src/constants/theme';
import { signUp, signIn, setDeviceRole } from '../src/engine/familyAccount';

type Step = 'welcome' | 'auth' | 'role' | 'child-details' | 'parent-pin' | 'lockdown' | 'done';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setPin, completeOnboarding } = useGuard();
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);

  // Role
  const [role, setRole] = useState<'parent' | 'child' | null>(null);

  // Child details
  const [childName, setChildName] = useState('');
  const [childBirthday, setChildBirthday] = useState('');
  const [ageBracket, setAgeBracket] = useState('8-10');

  // Parent PIN
  const [pin, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  // ── WELCOME ──
  if (step === 'welcome') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <View style={s.logoCircle}><Text style={s.logoText}>C</Text></View>
          <Text style={s.title}>Custorian</Text>
          <Text style={s.subtitle}>Coaching, not surveillance</Text>
          <Text style={s.body}>Custorian helps children navigate the online world safely — with AI-powered guidance, content safety ratings, and weekly insights for parents.</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => setStep('auth')}>
            <Text style={s.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── SIGN UP / SIGN IN ──
  if (step === 'auth') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.padded}>
          <Text style={s.stepLabel}>{isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}</Text>
          <Text style={s.heading}>{isSignUp ? 'Create your family account' : 'Welcome back'}</Text>
          <Text style={s.bodySmall}>{isSignUp ? 'One account for the whole family. You\'ll use the same email and password on your child\'s device.' : 'Sign in with your family account.'}</Text>

          <TextInput style={s.input} placeholder="Email" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={s.input} placeholder="Password" placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} secureTextEntry />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.primaryBtn} onPress={async () => {
            if (!email.trim() || !password.trim()) { setError('Enter email and password'); return; }
            if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
            setLoading(true); setError('');

            if (isSignUp) {
              const result = await signUp(email.trim(), password);
              if (!result.success) { setError(result.error || 'Sign up failed'); setLoading(false); return; }
              // Auto sign in after signup
              const loginResult = await signIn(email.trim(), password);
              if (!loginResult.success) { setError('Account created. Please sign in.'); setIsSignUp(false); setLoading(false); return; }
            } else {
              const result = await signIn(email.trim(), password);
              if (!result.success) { setError(result.error || 'Sign in failed'); setLoading(false); return; }
            }
            setLoading(false);
            setStep('role');
          }} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setError(''); }} style={{ marginTop: 16 }}>
            <Text style={s.link}>{isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── ROLE SELECTION ──
  if (step === 'role') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={[s.padded, { justifyContent: 'center', flexGrow: 1 }]}>
          <Text style={s.heading}>Who is using this device?</Text>

          <TouchableOpacity style={[s.roleCard, role === 'parent' && { borderColor: '#7c3aed', borderWidth: 2 }]} onPress={() => { setRole('parent'); setStep('parent-pin'); }}>
            <Image source={require('../assets/icon-parent.png')} style={{ width: 48, height: 48, marginBottom: 12, resizeMode: 'contain' }} />
            <Text style={s.roleTitle}>This is my device</Text>
            <Text style={s.roleDesc}>I'm the parent. I want to see weekly insights and manage my children's safety.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.roleCard, role === 'child' && { borderColor: '#7c3aed', borderWidth: 2 }]} onPress={() => { setRole('child'); setStep('child-details'); }}>
            <Image source={require('../assets/icon-child.png')} style={{ width: 48, height: 48, marginBottom: 12, resizeMode: 'contain' }} />
            <Text style={s.roleTitle}>This is my child's device</Text>
            <Text style={s.roleDesc}>Set up protection, Safety Coach, and Content Radar on this device.</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── CHILD DETAILS ──
  if (step === 'child-details') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.padded}>
          <Text style={s.stepLabel}>CHILD DEVICE</Text>
          <Text style={s.heading}>About this child</Text>

          <TextInput style={s.input} placeholder="Child's name (e.g. Emma)" placeholderTextColor="#9ca3af" value={childName} onChangeText={setChildName} />
          <TextInput style={s.input} placeholder="Birthday (DD/MM/YYYY)" placeholderTextColor="#9ca3af" value={childBirthday} onChangeText={(t) => {
            setChildBirthday(t);
            if (t.length === 10) {
              const parts = t.split('/');
              if (parts.length === 3) {
                const birth = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                if (age >= 5 && age <= 7) setAgeBracket('5-7');
                else if (age >= 8 && age <= 10) setAgeBracket('8-10');
                else if (age >= 11 && age <= 13) setAgeBracket('11-13');
                else if (age >= 14 && age <= 16) setAgeBracket('14-16');
                else if (age >= 17) setAgeBracket('17+');
              }
            }
          }} keyboardType="numbers-and-punctuation" maxLength={10} />

          {childBirthday.length === 10 && (
            <View style={{ backgroundColor: '#ede9fe', borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#7c3aed', fontWeight: '600', textAlign: 'center' }}>Age bracket: {ageBracket} (auto-detected from birthday)</Text>
            </View>
          )}

          <TouchableOpacity style={s.primaryBtn} onPress={() => setStep('parent-pin')}>
            <Text style={s.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PARENT PIN ──
  if (step === 'parent-pin') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.padded}>
          <Text style={s.stepLabel}>{role === 'child' ? 'PARENT CONFIRMATION' : 'SECURITY'}</Text>
          <Text style={s.heading}>{role === 'child' ? 'Parent: set a PIN for this device' : 'Create your parent PIN'}</Text>
          <Text style={s.bodySmall}>This PIN protects settings and alerts. Your child won't be able to disable protection without it.</Text>

          <TextInput style={s.pinInput} placeholder="4-digit PIN" placeholderTextColor="#9ca3af" value={pin} onChangeText={setPinValue} keyboardType="number-pad" maxLength={4} secureTextEntry />
          <TextInput style={s.pinInput} placeholder="Confirm PIN" placeholderTextColor="#9ca3af" value={pinConfirm} onChangeText={setPinConfirm} keyboardType="number-pad" maxLength={4} secureTextEntry />

          <TouchableOpacity style={s.primaryBtn} onPress={async () => {
            if (pin.length !== 4) { Alert.alert('PIN must be 4 digits'); return; }
            if (pin !== pinConfirm) { Alert.alert('PINs don\'t match'); return; }
            await setPin(pin);

            // Set device role
            const deviceName = role === 'child' ? (childName || 'Child device') : 'Parent device';
            await setDeviceRole(role || 'parent', deviceName, childName, ageBracket, childBirthday);

            // Save birthday for Content Radar
            if (childBirthday.length === 10 && role === 'child') {
              const parts = childBirthday.split('/');
              if (parts.length === 3) {
                const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                await AsyncStorage.setItem('custorian_child_birthday', `${parts[2]}-${parts[1]}-${parts[0]}`);
              }
            }

            if (role === 'child') {
              setStep('lockdown');
            } else {
              await completeOnboarding();
              router.replace('/home');
            }
          }}>
            <Text style={s.primaryBtnText}>{role === 'child' ? 'Activate Protection' : 'Start Monitoring'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LOCKDOWN GUIDE (child device only) ──
  if (step === 'lockdown') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.padded}>
          <Text style={s.stepLabel}>FINAL STEP</Text>
          <Text style={s.heading}>Lock down this device</Text>

          <View style={[s.infoCard, { backgroundColor: '#fef3c7', borderColor: '#fcd34d' }]}>
            <Text style={[s.infoTitle, { color: '#92400e' }]}>Recommended settings</Text>
            <Text style={[s.infoText, { color: '#78350f' }]}>1. Settings → Screen Time → Content & Privacy Restrictions → ON</Text>
            <Text style={[s.infoText, { color: '#78350f' }]}>2. Set a Screen Time passcode your child doesn't know</Text>
            <Text style={[s.infoText, { color: '#78350f' }]}>3. iTunes & App Store Purchases → Deleting Apps → Don't Allow</Text>
            <Text style={[s.infoText, { color: '#78350f' }]}>4. This prevents your child from deleting the app or changing settings</Text>
          </View>

          <View style={[s.infoCard, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
            <Text style={[s.infoTitle, { color: '#166534' }]}>What's now active</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• Safety Coach — AI guidance when something feels off</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• Content Radar — safety ratings for games, shows, platforms</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• "I need help" button with crisis helplines</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• Photo protection (PhotoDNA + Cloud Vision + Hive)</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• Settings locked behind your PIN</Text>
            <Text style={[s.infoText, { color: '#15803d' }]}>• Weekly trend insights sent to your device</Text>
          </View>

          <TouchableOpacity style={s.primaryBtn} onPress={async () => {
            await completeOnboarding();
            router.replace('/home');
          }}>
            <Text style={s.primaryBtnText}>Done — Start Protection</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8FF' },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  padded: { padding: 24, paddingTop: 48 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  title: { fontSize: 28, fontWeight: '800', color: '#2d2b55', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#7c3aed', fontWeight: '600', marginTop: 4, marginBottom: 24 },
  body: { fontSize: 14, color: '#7c7a9a', textAlign: 'center', lineHeight: 21, maxWidth: 300, marginBottom: 32 },
  bodySmall: { fontSize: 13, color: '#7c7a9a', lineHeight: 19, marginBottom: 24 },
  stepLabel: { fontSize: 10, fontWeight: '700', color: '#7c3aed', letterSpacing: 2, marginBottom: 8 },
  heading: { fontSize: 24, fontWeight: '800', color: '#2d2b55', letterSpacing: -0.5, marginBottom: 8 },
  input: { backgroundColor: '#f5f3ff', borderWidth: 1, borderColor: '#eae8f0', borderRadius: 20, padding: 14, fontSize: 15, marginBottom: 12, color: '#2d2b55' },
  pinInput: { backgroundColor: '#f5f3ff', borderWidth: 1, borderColor: '#eae8f0', borderRadius: 20, padding: 16, fontSize: 24, fontWeight: '700', textAlign: 'center', letterSpacing: 8, marginBottom: 12, color: '#2d2b55' },
  primaryBtn: { backgroundColor: '#7c3aed', borderRadius: 100, padding: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { fontSize: 13, color: '#7c3aed', textAlign: 'center', fontWeight: '500' },
  error: { fontSize: 12, color: '#ef4444', textAlign: 'center', marginBottom: 8, backgroundColor: '#fef2f2', padding: 10, borderRadius: 8 },
  roleCard: { backgroundColor: '#f5f3ff', borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#eae8f0' },
  roleIcon: { fontSize: 32, marginBottom: 12 },
  roleTitle: { fontSize: 17, fontWeight: '700', color: '#2d2b55', marginBottom: 4 },
  roleDesc: { fontSize: 13, color: '#7c7a9a', lineHeight: 18 },
  ageLabel: { fontSize: 12, fontWeight: '600', color: '#7c7a9a', marginBottom: 8 },
  agePills: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  agePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: '#f5f3ff' },
  agePillActive: { backgroundColor: '#7c3aed' },
  agePillText: { fontSize: 13, fontWeight: '600', color: '#7c7a9a' },
  agePillTextActive: { color: '#fff' },
  infoCard: { borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1 },
  infoTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  infoText: { fontSize: 12, lineHeight: 18 },
});
