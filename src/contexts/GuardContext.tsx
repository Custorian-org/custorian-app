import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RiskAlert, ThreatCategory, analyzeText, createAlert } from '../engine/riskEngine';
import { analyzeMultilang } from '../engine/riskEngineMultilang';
import { analyzeConversationBehavior } from '../engine/behaviorEngine';
import { photoWatcher, PhotoAlert } from '../engine/photoWatcher';
import { checkEmergency, triggerEmergencyAlert } from '../engine/emergencyAlert';

interface GuardContextType {
  alerts: RiskAlert[];
  monitoringActive: boolean;
  isOnboarded: boolean;
  pin: string | null;
  unreviewedCount: number;
  toggleMonitoring: () => void;
  processMessage: (text: string, sourceApp?: string) => RiskAlert | null;
  markReviewed: (id: string) => void;
  clearAlerts: () => void;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => boolean;
  completeOnboarding: () => Promise<void>;
}

const GuardContext = createContext<GuardContextType | null>(null);

export function GuardProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [pin, setStoredPin] = useState<string | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    try {
      const [savedAlerts, savedPin, onboarded] = await Promise.all([
        AsyncStorage.getItem('risk_alerts'),
        AsyncStorage.getItem('parent_pin'),
        AsyncStorage.getItem('onboarded'),
      ]);
      if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
      if (savedPin) setStoredPin(savedPin);
      if (onboarded === 'true') setIsOnboarded(true);
    } catch {}
  }

  async function saveAlerts(newAlerts: RiskAlert[]) {
    setAlerts(newAlerts);
    await AsyncStorage.setItem('risk_alerts', JSON.stringify(newAlerts));
  }

  // Photo watcher — start/stop with monitoring toggle
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  useEffect(() => {
    if (monitoringActive) {
      photoWatcher.requestPermission().then((granted) => {
        if (granted) {
          photoWatcher.startWatching((photoAlert: PhotoAlert) => {
            const updated = [photoAlert, ...alertsRef.current];
            saveAlerts(updated);
          });
        }
      });
    } else {
      photoWatcher.stopWatching();
    }
    return () => photoWatcher.stopWatching();
  }, [monitoringActive]);

  function toggleMonitoring() {
    setMonitoringActive((prev) => !prev);
  }

  function processMessage(text: string, sourceApp = 'unknown'): RiskAlert | null {
    // Run both English and multilang analysis, use the higher-scoring result
    const enResult = analyzeText(text);
    const mlResult = analyzeMultilang(text);

    let result = enResult;
    if (mlResult && (!result || mlResult.score > result.score)) {
      result = mlResult;
    }

    // Merge triggered patterns from both if both returned results
    if (result && enResult && mlResult && result === mlResult && enResult.triggeredPatterns.length > 0) {
      result = { ...result, triggeredPatterns: [...new Set([...result.triggeredPatterns, ...enResult.triggeredPatterns])] };
    } else if (result && enResult && mlResult && result === enResult && mlResult.triggeredPatterns.length > 0) {
      result = { ...result, triggeredPatterns: [...new Set([...result.triggeredPatterns, ...mlResult.triggeredPatterns])] };
    }

    if (!result) return null;

    const alert = createAlert(result.category, result.score, text, sourceApp);
    const updated = [alert, ...alerts];

    // Run behavioral analysis and merge any behavioral alerts
    const behaviorAlerts = analyzeConversationBehavior(text, sourceApp, sourceApp);
    for (const ba of behaviorAlerts) {
      const behaviorRiskAlert = createAlert(
        'grooming' as ThreatCategory,
        ba.severity,
        `[Behavior: ${ba.pattern}] ${ba.description}`,
        sourceApp
      );
      updated.push(behaviorRiskAlert);
    }

    saveAlerts(updated);

    // Check for emergency-level alerts
    if (checkEmergency(alert)) {
      triggerEmergencyAlert(alert);
    }

    return alert;
  }

  function markReviewed(id: string) {
    const updated = alerts.map((a) =>
      a.id === id ? { ...a, reviewed: true } : a
    );
    saveAlerts(updated);
  }

  function clearAlerts() {
    saveAlerts([]);
  }

  async function setPin(newPin: string) {
    setStoredPin(newPin);
    await AsyncStorage.setItem('parent_pin', newPin);
  }

  function verifyPin(attempt: string): boolean {
    return attempt === pin;
  }

  async function completeOnboarding() {
    setIsOnboarded(true);
    await AsyncStorage.setItem('onboarded', 'true');
  }

  const unreviewedCount = alerts.filter((a) => !a.reviewed).length;

  return (
    <GuardContext.Provider
      value={{
        alerts,
        monitoringActive,
        isOnboarded,
        pin,
        unreviewedCount,
        toggleMonitoring,
        processMessage,
        markReviewed,
        clearAlerts,
        setPin,
        verifyPin,
        completeOnboarding,
      }}
    >
      {children}
    </GuardContext.Provider>
  );
}

export function useGuard() {
  const ctx = useContext(GuardContext);
  if (!ctx) throw new Error('useGuard must be inside GuardProvider');
  return ctx;
}
