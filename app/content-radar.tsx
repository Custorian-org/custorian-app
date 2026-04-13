import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/constants/theme';
import {
  ContentEntry, searchContent, getAllContent, getThemeWarnings,
  checkAgeAppropriate, ContentType,
} from '../src/engine/contentRadar';
import { searchAllApis, hasApiKeys } from '../src/engine/contentApis';

const TYPE_FILTERS: { label: string; value: ContentType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: '🎮 Games', value: 'game' },
  { label: '📺 Shows', value: 'show' },
  { label: '🎬 Movies', value: 'movie' },
  { label: '📱 Apps', value: 'app' },
  { label: '▶️ YouTube', value: 'youtube' },
  { label: '🎵 TikTok', value: 'tiktok' },
];

export default function ContentRadarScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ContentType | 'all'>('all');
  const [childAge, setChildAge] = useState(10);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<ContentEntry[]>([]);
  const [searching, setSearching] = useState(false);

  const localResults = query.trim()
    ? searchContent(query)
    : getAllContent().filter((e) => filter === 'all' || e.type === filter);

  const results = [...localResults, ...apiResults];

  const searchApis = useCallback(async (q: string) => {
    if (!q.trim() || !hasApiKeys()) return;
    setSearching(true);
    try {
      const type = filter === 'all' ? undefined : filter;
      const remote = await searchAllApis(q, type);
      const localNames = new Set(localResults.map((r) => r.name.toLowerCase()));
      setApiResults(remote.filter((r) => !localNames.has(r.name.toLowerCase())));
    } catch {
      setApiResults([]);
    }
    setSearching(false);
  }, [filter, localResults]);

  function renderEntry({ item }: { item: ContentEntry }) {
    const isExpanded = expanded === item.name;
    const ageCheck = checkAgeAppropriate(item, childAge);
    const warnings = getThemeWarnings(item);
    const isRisky = !ageCheck.appropriate || warnings.length > 0;

    return (
      <TouchableOpacity
        style={[styles.card, isRisky && styles.cardRisky]}
        onPress={() => setExpanded(isExpanded ? null : item.name)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.ratingBadge, { backgroundColor: ageColor(item.ageRating, childAge) }]}>
                <Text style={styles.ratingText}>{item.officialRating}</Text>
              </View>
              <Text style={styles.ageText}>Age {item.ageRating}+</Text>
              {!ageCheck.appropriate && (
                <View style={styles.underAgeBadge}>
                  <Text style={styles.underAgeText}>Under-age</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
        </View>

        {isExpanded && (
          <View style={styles.detail}>
            <Text style={styles.parentNote}>{item.parentNote}</Text>

            {warnings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Concerning themes</Text>
                <View style={styles.tagWrap}>
                  {warnings.map((w) => (
                    <View key={w} style={styles.dangerTag}>
                      <Text style={styles.dangerTagText}>{w}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {item.themes.filter((t) => ['positive', 'educational', 'creativity', 'teamwork', 'problem-solving', 'empathy', 'humor'].includes(t)).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Positive aspects</Text>
                <View style={styles.tagWrap}>
                  {item.themes
                    .filter((t) => ['positive', 'educational', 'creativity', 'teamwork', 'problem-solving', 'empathy', 'humor'].includes(t))
                    .map((t) => (
                      <View key={t} style={styles.safeTag}>
                        <Text style={styles.safeTagText}>{t}</Text>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {item.alternatives.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Better alternatives</Text>
                {item.alternatives.map((alt) => (
                  <Text key={alt} style={styles.altText}>→ {alt}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Content Radar</Text>
        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>What is your child watching or playing today?</Text>
      </View>

      {/* Did you know? (Andreessen) */}
      <View style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: '#ede9fe', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: '#7c3aed20' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#7c3aed', letterSpacing: 1, marginBottom: 4 }}>DID YOU KNOW?</Text>
        <Text style={{ fontSize: 13, color: '#4c1d95', lineHeight: 19 }}>Fortnite is rated PEGI 12, but 45% of players are under 10. Tap to check any game or show.</Text>
      </View>

      {/* Age selector */}
      <View style={styles.ageRow}>
        <Text style={styles.ageLabel}>CHILD'S AGE</Text>
        <View style={styles.ageBubbles}>
          {[8, 10, 12, 14, 16].map((age) => (
            <TouchableOpacity
              key={age}
              style={[styles.ageBubble, childAge === age && styles.ageBubbleActive]}
              onPress={() => setChildAge(age)}
            >
              <Text style={[styles.ageBubbleText, childAge === age && styles.ageBubbleTextActive]}>{age}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search games, shows, YouTube..."
          placeholderTextColor={Colors.textMute}
          value={query}
          onChangeText={(text) => { setQuery(text); setApiResults([]); }}
          onSubmitEditing={() => searchApis(query)}
          returnKeyType="search"
        />
      </View>

      {searching && (
        <View style={styles.searchingRow}>
          <ActivityIndicator size="small" color={Colors.accent} />
          <Text style={styles.searchingText}>Searching online...</Text>
        </View>
      )}

      {/* Type filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {TYPE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => { setFilter(f.value); setQuery(''); }}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.name}
        renderItem={renderEntry}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.sm }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyText}>No content found</Text>
            <Text style={styles.emptyHint}>Try searching for a game, show, or creator</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function ageColor(requiredAge: number, childAge: number): string {
  if (childAge >= requiredAge) return Colors.safe;
  if (requiredAge - childAge <= 2) return Colors.warning;
  return Colors.danger;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  backBtn: { fontSize: 14, color: '#7c3aed', marginBottom: Spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },

  // Age selector
  ageRow: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  ageLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 2.5, marginBottom: Spacing.sm },
  ageBubbles: { flexDirection: 'row', gap: Spacing.sm },
  ageBubble: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e5e7eb',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.card,
  },
  ageBubbleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  ageBubbleText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  ageBubbleTextActive: { color: Colors.bg },

  // Search
  searchWrap: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: '#e5e7eb',
  },
  searchingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  searchingText: { fontSize: 12, color: '#9ca3af' },

  // Filters
  filterScroll: { flexGrow: 0, marginBottom: Spacing.sm },
  filterContent: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: Colors.accent + '20', borderColor: Colors.accent + '40' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  filterTextActive: { color: '#7c3aed' },

  // Cards
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  cardRisky: { borderLeftWidth: 3, borderLeftColor: Colors.warning },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  ratingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ratingText: { fontSize: 11, fontWeight: '700', color: Colors.bg },
  ageText: { fontSize: 12, color: '#6b7280' },
  underAgeBadge: { backgroundColor: Colors.danger + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  underAgeText: { fontSize: 10, fontWeight: '700', color: Colors.danger },
  expandIcon: { fontSize: 20, color: '#9ca3af', fontWeight: '300' },

  // Detail
  detail: { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  parentNote: { fontSize: 14, color: '#6b7280', lineHeight: 22, marginBottom: Spacing.md },
  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.5, marginBottom: Spacing.sm },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dangerTag: { backgroundColor: Colors.danger + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  dangerTagText: { fontSize: 11, fontWeight: '600', color: Colors.danger },
  safeTag: { backgroundColor: Colors.safe + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  safeTagText: { fontSize: 11, fontWeight: '600', color: Colors.safe },
  altText: { fontSize: 13, color: '#6b7280', lineHeight: 22 },

  // Empty
  empty: { padding: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  emptyHint: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
});
