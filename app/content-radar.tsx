import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../src/constants/theme';
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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ContentType | 'all'>('all');
  const [childAge, setChildAge] = useState(10);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<ContentEntry[]>([]);
  const [searching, setSearching] = useState(false);

  // Local results first
  const localResults = query.trim()
    ? searchContent(query)
    : getAllContent().filter((e) => filter === 'all' || e.type === filter);

  // Combined: local + API results
  const results = [...localResults, ...apiResults];

  // Search APIs when user submits a query not found locally
  const searchApis = useCallback(async (q: string) => {
    if (!q.trim() || !hasApiKeys()) return;
    setSearching(true);
    try {
      const type = filter === 'all' ? undefined : filter;
      const remote = await searchAllApis(q, type);
      // Deduplicate against local results
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
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.tagRow}>
              <View style={[styles.ratingBadge, { backgroundColor: ageColor(item.ageRating, childAge) }]}>
                <Text style={styles.ratingText}>{item.officialRating}</Text>
              </View>
              <Text style={styles.ageText}>Age {item.ageRating}+</Text>
              {!ageCheck.appropriate && (
                <Text style={styles.warningTag}>⚠️ Under-age</Text>
              )}
            </View>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>

        {isExpanded && (
          <View style={styles.detail}>
            {/* Parent note */}
            <Text style={styles.parentNote}>{item.parentNote}</Text>

            {/* Theme tags */}
            {warnings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚠️ Concerning themes:</Text>
                <View style={styles.tagRow}>
                  {warnings.map((w) => (
                    <View key={w} style={styles.themeTag}>
                      <Text style={styles.themeTagText}>{w}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Positive themes */}
            {item.themes.filter((t) => ['positive', 'educational', 'creativity', 'teamwork', 'problem-solving', 'empathy'].includes(t)).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ Positive aspects:</Text>
                <View style={styles.tagRow}>
                  {item.themes
                    .filter((t) => ['positive', 'educational', 'creativity', 'teamwork', 'problem-solving', 'empathy'].includes(t))
                    .map((t) => (
                      <View key={t} style={[styles.themeTag, { backgroundColor: Colors.safe + '20' }]}>
                        <Text style={[styles.themeTagText, { color: Colors.safe }]}>{t}</Text>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {/* Alternatives */}
            {item.alternatives.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Better alternatives:</Text>
                {item.alternatives.map((alt) => (
                  <Text key={alt} style={styles.altText}>• {alt}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Child age selector */}
      <View style={styles.ageSelector}>
        <Text style={styles.ageLabel}>Child's age:</Text>
        {[8, 10, 12, 14, 16].map((age) => (
          <TouchableOpacity
            key={age}
            style={[styles.ageBubble, childAge === age && styles.ageBubbleActive]}
            onPress={() => setChildAge(age)}
          >
            <Text style={[styles.ageBubbleText, childAge === age && { color: Colors.white }]}>{age}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search games, shows, YouTube, movies..."
        value={query}
        onChangeText={(text) => { setQuery(text); setApiResults([]); }}
        onSubmitEditing={() => searchApis(query)}
        returnKeyType="search"
      />
      {searching && (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4 }}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={{ marginLeft: 8, color: Colors.textLight, fontSize: 12 }}>Searching online databases...</Text>
        </View>
      )}
      {hasApiKeys() && query.trim() && localResults.length === 0 && !searching && (
        <TouchableOpacity style={{ paddingHorizontal: 16, paddingTop: 8 }} onPress={() => searchApis(query)}>
          <Text style={{ color: Colors.primary, fontSize: 13 }}>Not found locally — tap to search online →</Text>
        </TouchableOpacity>
      )}

      {/* Type filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {TYPE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => { setFilter(f.value); setQuery(''); }}
          >
            <Text style={[styles.filterText, filter === f.value && { color: Colors.white }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.name}
        renderItem={renderEntry}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No content found. Try a different search.</Text>
          </View>
        }
      />
    </View>
  );
}

function ageColor(requiredAge: number, childAge: number): string {
  if (childAge >= requiredAge) return Colors.safe;
  if (requiredAge - childAge <= 2) return Colors.warning;
  return Colors.danger;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  ageSelector: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 },
  ageLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, marginRight: 8 },
  ageBubble: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
  ageBubbleActive: { backgroundColor: Colors.primary },
  ageBubbleText: { fontSize: 14, fontWeight: 'bold', color: Colors.primary },
  searchInput: { backgroundColor: Colors.white, marginHorizontal: 16, borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#eee' },
  filterRow: { paddingHorizontal: 12, paddingVertical: 12, flexGrow: 0 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: '#eee', marginHorizontal: 4 },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '500', color: Colors.text },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardRisky: { borderLeftWidth: 3, borderLeftColor: Colors.warning },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 },
  ratingBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  ratingText: { fontSize: 11, fontWeight: 'bold', color: Colors.white },
  ageText: { fontSize: 12, color: Colors.textLight },
  warningTag: { fontSize: 12, color: Colors.danger, marginLeft: 8, fontWeight: '600' },
  expandIcon: { fontSize: 14, color: Colors.textLight },
  detail: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  parentNote: { fontSize: 14, color: Colors.text, lineHeight: 20, marginBottom: 12 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  themeTag: { backgroundColor: Colors.danger + '15', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
  themeTagText: { fontSize: 11, fontWeight: '600', color: Colors.danger },
  altText: { fontSize: 13, color: Colors.text, lineHeight: 20, marginLeft: 4 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textLight },
});
