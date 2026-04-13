import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GuardProvider } from '../src/contexts/GuardContext';

export default function RootLayout() {
  return (
    <GuardProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="pin-setup" />
        <Stack.Screen name="home" />
        <Stack.Screen name="test" options={{ headerShown: true, title: 'Test Detection' }} />
        <Stack.Screen name="dashboard" options={{ headerShown: true, title: 'Parent Dashboard' }} />
        <Stack.Screen name="content-radar" options={{ headerShown: true, title: 'Content Radar' }} />
        <Stack.Screen name="school-dashboard" options={{ headerShown: true, title: 'School Dashboard' }} />
        <Stack.Screen name="parent-guide" options={{ headerShown: true, title: 'Parent Guide' }} />
        <Stack.Screen name="intervention" options={{ presentation: 'modal', headerShown: true, title: 'Safety Alert' }} />
        <Stack.Screen name="rate-creator" options={{ headerShown: true, title: 'Rate Creator' }} />
      </Stack>
    </GuardProvider>
  );
}
