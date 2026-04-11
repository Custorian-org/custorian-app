import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import InterventionModal from '../src/components/InterventionModal';
import { ThreatCategory } from '../src/engine/riskEngine';

export default function InterventionScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: ThreatCategory }>();

  return (
    <InterventionModal
      category={category || 'grooming'}
      onDismiss={() => router.back()}
    />
  );
}
