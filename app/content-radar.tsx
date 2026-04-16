import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../src/constants/theme';
import {
  ContentEntry, searchContent, getAllContent, getThemeWarnings,
  checkAgeAppropriate, ContentType,
} from '../src/engine/contentRadar';
import { searchAllApis, hasApiKeys, getAllPlatforms, searchPlatforms, PLATFORM_CATEGORIES, getPlatformsByCategory, PlatformCategory } from '../src/engine/contentApis';
import {
  getRatingsForCreator, aggregateRatings, AggregatedRating,
} from '../src/engine/communityRatings';
import { getAIAssessment, AIAssessment } from '../src/engine/aiContentAssessment';

// ── DID YOU KNOW FACTS ──────────────────────────
// Rotates on every screen load. Mix of sourced stats for parents.
const DID_YOU_KNOW_FACTS = [
  { text: 'Fortnite is rated PEGI 12, but 45% of players are under 10.', source: 'Ofcom 2024' },
  { text: 'The average grooming conversation reaches an exploitation request within 45 minutes.', source: 'IWF 2023' },
  { text: '1 in 3 children aged 8-11 have a social media profile despite minimum age requirements of 13.', source: 'Ofcom 2024' },
  { text: '72% of apps in the Play Store children\'s category transmit data to third-party trackers.', source: 'ICSI/USENIX' },
  { text: 'Roblox has 67 million daily active users. Over half are under 13.', source: 'Roblox Corp 2024' },
  { text: 'Children who experience cyberbullying are 2x more likely to self-harm.', source: 'The Lancet 2023' },
  { text: 'TikTok\'s algorithm can show self-harm content to a new teen account within 30 minutes.', source: 'CCDH 2023' },
  { text: 'Discord is used by 65% of teens aged 13-17 but has no age verification.', source: 'Pew Research 2024' },
  { text: '36.2 million CSAM reports were filed with NCMEC in 2023 — up 12% from 2022.', source: 'NCMEC 2024' },
  { text: 'Children spend an average of 3.5 hours per day on screens outside of school.', source: 'Common Sense Media 2024' },
  { text: 'Snapchat\'s "My AI" chatbot engaged in sexually explicit conversations when posing as a 15-year-old.', source: 'Washington Post 2023' },
  { text: '67% of parents say technology is the #1 reason parenting is harder today than 20 years ago.', source: 'Pew Research 2024' },
  { text: 'WhatsApp is the #1 platform used by predators to contact children after initial contact elsewhere.', source: 'NCMEC 2023' },
  { text: 'YouTube Kids still shows age-inappropriate content despite moderation — 1 in 5 videos flagged by researchers.', source: 'University of Michigan 2023' },
  { text: 'Instagram\'s algorithm showed eating disorder content to teen test accounts within 3 minutes.', source: 'CCDH 2022' },
  { text: 'Sextortion cases involving minors increased 300% between 2021 and 2023.', source: 'FBI IC3 2024' },
  { text: '89% of children lie about their age to access social media platforms.', source: 'Thorn 2023' },
  { text: 'The average age a child first sees pornography online is 12 years old.', source: 'BBFC 2023' },
  { text: 'Denmark\'s under-15 social media law takes effect in 2027 — one of the first in Europe.', source: 'Danish Government 2025' },
  { text: 'Only 39% of parents have ever checked their child\'s messaging app history.', source: 'Kaspersky 2024' },
];

function getRandomFact() {
  return DID_YOU_KNOW_FACTS[Math.floor(Math.random() * DID_YOU_KNOW_FACTS.length)];
}

const TYPE_FILTERS: { label: string; value: ContentType | 'all' | 'platform' }[] = [
  { label: 'All', value: 'all' },
  { label: '📱 Platforms', value: 'platform' },
  { label: '🎮 Games', value: 'game' },
  { label: '📺 Shows', value: 'show' },
  { label: '🎬 Movies', value: 'movie' },
];

const RISK_COLORS: Record<string, string> = {
  safe: Colors.safe,
  caution: Colors.warning,
  not_recommended: Colors.danger,
};

const RISK_LABELS: Record<string, string> = {
  safe: 'Safe',
  caution: 'Caution',
  not_recommended: 'Not recommended',
};

export default function ContentRadarScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ContentType | 'all'>('all');
  const [childAge, setChildAge] = useState(10);
  const [defaultAge, setDefaultAge] = useState(0); // The child's actual age from birthday

  // Load child's age from family config if available
  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const birthday = await AsyncStorage.getItem('custorian_child_birthday');
        if (birthday) {
          const age = Math.floor((Date.now() - new Date(birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          if (age >= 3 && age <= 18) {
            setChildAge(age);
            setDefaultAge(age);
          }
        } else {
          const { getFamilyConfig } = await import('../src/engine/familySync');
          const config = await getFamilyConfig();
          if (config?.ageBracket) {
            const ageMap: Record<string, number> = { '5-7': 6, '8-10': 9, '11-13': 12, '14-16': 15, '17+': 17 };
            const age = ageMap[config.ageBracket] || 10;
            setChildAge(age);
            setDefaultAge(age);
          }
        }
      } catch {}
    })();
  }, []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<ContentEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [communityData, setCommunityData] = useState<Record<string, AggregatedRating | null>>({});
  const [aiData, setAiData] = useState<Record<string, AIAssessment | null>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [currentFact] = useState(getRandomFact);
  const [platformSubFilter, setPlatformSubFilter] = useState<PlatformCategory | undefined>(undefined);

  const localResults = filter === 'platform'
    ? (query.trim() ? searchPlatforms(query) : getPlatformsByCategory(platformSubFilter))
    : query.trim()
      ? searchContent(query)
      : getAllContent().filter((e) => filter === 'all' || e.type === filter);

  const results = [...localResults, ...apiResults];

  // Load community ratings when a card is expanded
  useEffect(() => {
    if (!expanded) return;
    if (communityData[expanded] !== undefined) return;
    (async () => {
      const ratings = await getRatingsForCreator(expanded);
      const agg = aggregateRatings(ratings);
      setCommunityData((prev) => ({ ...prev, [expanded]: agg }));
    })();
  }, [expanded]);

  // Load community data + auto-trigger AI when no results found
  useEffect(() => {
    if (!query.trim() || results.length > 0) return;
    const key = query.trim();

    // Load community data
    if (communityData[key] === undefined) {
      (async () => {
        const ratings = await getRatingsForCreator(key);
        const agg = aggregateRatings(ratings);
        setCommunityData((prev) => ({ ...prev, [key]: agg }));
      })();
    }

    // Auto-trigger AI if no community data and not already loaded
    if (aiData[key] === undefined && !aiLoading) {
      setAiLoading(true);
      getAIAssessment(key).then(assessment => {
        setAiData(prev => ({ ...prev, [key]: assessment }));
        setAiLoading(false);
      });
    }
  }, [query, results.length]);

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

  function renderCommunitySection(name: string) {
    const agg = communityData[name];
    if (!agg) return null;

    return (
      <View style={styles.communitySection}>
        <Text style={styles.sectionTitle}>Community ratings ({agg.totalRatings} parents)</Text>

        {/* Age bracket risk levels */}
        {(['8-10', '11-13', '14-16'] as const).map((bracket) => {
          const score = agg.ageBracketScores[bracket];
          return (
            <View key={bracket} style={styles.bracketRow}>
              <Text style={styles.bracketLabel}>Age {bracket}:</Text>
              <View style={[styles.bracketBadge, { backgroundColor: RISK_COLORS[score.risk] + '20' }]}>
                <Text style={[styles.bracketText, { color: RISK_COLORS[score.risk] }]}>
                  {RISK_LABELS[score.risk]} ({score.percentage}%)
                </Text>
              </View>
            </View>
          );
        })}

        {/* Top themes */}
        {agg.topThemes.length > 0 && (
          <View style={{ marginTop: Spacing.sm }}>
            <View style={styles.tagWrap}>
              {agg.topThemes.map((t) => {
                const isPositive = ['positive', 'educational', 'creativity', 'teamwork', 'empathy', 'humor'].includes(t);
                return (
                  <View key={t} style={isPositive ? styles.safeTag : styles.dangerTag}>
                    <Text style={isPositive ? styles.safeTagText : styles.dangerTagText}>{t}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Sample notes */}
        {agg.sampleNotes.length > 0 && (
          <View style={{ marginTop: Spacing.sm }}>
            {agg.sampleNotes.map((note, i) => (
              <Text key={i} style={styles.communityNote}>"{note}"</Text>
            ))}
          </View>
        )}
      </View>
    );
  }

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

            {/* Community ratings section */}
            {renderCommunitySection(item.name)}

            {/* Rate this creator button */}
            <TouchableOpacity
              style={styles.rateBtn}
              onPress={() => router.push({ pathname: '/rate-creator', params: { name: item.name } })}
            >
              <Text style={styles.rateBtnText}>Rate this creator</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // When no results found, check community data for the query
  const noResults = query.trim().length > 0 && results.length === 0 && !searching;
  const communityFallback = noResults ? communityData[query.trim()] : null;

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

      {/* Did you know? — rotates every session, shareable */}
      <View style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: '#ede9fe', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: '#7c3aed20' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#7c3aed', letterSpacing: 1 }}>DID YOU KNOW?</Text>
          <TouchableOpacity
            onPress={() => {
              const f = currentFact;
              Share.share({
                message: `Did you know? ${f.text} (${f.source})\n\nCheck what your kids are using: custorian.org`,
              });
            }}
          >
            <Text style={{ fontSize: 11, color: '#7c3aed', fontWeight: '600' }}>Share ↗</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 13, color: '#4c1d95', lineHeight: 19 }}>{currentFact.text}</Text>
        <Text style={{ fontSize: 10, color: '#7c3aed80', marginTop: 4 }}>Source: {currentFact.source}</Text>
      </View>

      {/* Age selector — dropdown */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', letterSpacing: 1.5 }}>AGE</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 }}>
          {[5,6,7,8,9,10,11,12,13,14,15,16,17,18].map((age) => (
            <TouchableOpacity
              key={age}
              onPress={() => setChildAge(age)}
              style={{
                width: 36, height: 36, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: childAge === age ? '#7c3aed' : age === defaultAge ? '#ede9fe' : '#f3f4f6',
                borderWidth: age === defaultAge && childAge !== age ? 2 : 0,
                borderColor: '#7c3aed',
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: '700',
                color: childAge === age ? '#fff' : age === defaultAge ? '#7c3aed' : '#6b7280',
              }}>{age}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {defaultAge > 0 && childAge !== defaultAge && (
        <TouchableOpacity
          style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.md }}
          onPress={() => setChildAge(defaultAge)}
        >
          <Text style={{ fontSize: 11, color: '#7c3aed', fontWeight: '600' }}>← Reset to {defaultAge} (your child's age)</Text>
        </TouchableOpacity>
      )}

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search any creator, game, show..."
            placeholderTextColor={'#9ca3af'}
            value={query}
            onChangeText={(text) => { setQuery(text); setApiResults([]); }}
            onSubmitEditing={() => searchApis(query)}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => searchApis(query)}
            activeOpacity={0.7}
          >
            {(searching || aiLoading) ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchBtnText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>
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

      {/* Platform subcategory filters */}
      {filter === 'platform' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, !platformSubFilter && styles.filterChipActive]}
            onPress={() => setPlatformSubFilter(undefined)}
          >
            <Text style={[styles.filterText, !platformSubFilter && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {PLATFORM_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.filterChip, platformSubFilter === cat.key && styles.filterChipActive]}
              onPress={() => setPlatformSubFilter(cat.key)}
            >
              <Text style={[styles.filterText, platformSubFilter === cat.key && styles.filterTextActive]}>{cat.icon} {cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.name}
        renderItem={renderEntry}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.sm }}
        ListEmptyComponent={
          noResults ? (
            <View style={styles.noOfficialWrap}>
              <Text style={styles.noOfficialTitle}>No official rating for "{query.trim()}"</Text>
              {communityFallback ? (
                <View style={styles.communityFallbackCard}>
                  <Text style={styles.communityFallbackHeading}>Community says:</Text>
                  {(['8-10', '11-13', '14-16'] as const).map((bracket) => {
                    const score = communityFallback.ageBracketScores[bracket];
                    return (
                      <View key={bracket} style={styles.bracketRow}>
                        <Text style={styles.bracketLabel}>Age {bracket}:</Text>
                        <View style={[styles.bracketBadge, { backgroundColor: RISK_COLORS[score.risk] + '20' }]}>
                          <Text style={[styles.bracketText, { color: RISK_COLORS[score.risk] }]}>
                            {RISK_LABELS[score.risk]} ({score.percentage}%)
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  {communityFallback.sampleNotes.length > 0 && (
                    <View style={{ marginTop: Spacing.sm }}>
                      {communityFallback.sampleNotes.map((note, i) => (
                        <Text key={i} style={styles.communityNote}>"{note}"</Text>
                      ))}
                    </View>
                  )}
                  <Text style={styles.communityCount}>{communityFallback.totalRatings} parent ratings</Text>
                </View>
              ) : aiData[query.trim()] ? (
                <View style={styles.communityFallbackCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: RISK_COLORS[aiData[query.trim()]!.risk], marginRight: 8 }} />
                    <Text style={[styles.communityFallbackHeading, { marginBottom: 0 }]}>
                      {aiData[query.trim()]!.risk === 'safe' ? 'Likely safe' : aiData[query.trim()]!.risk === 'caution' ? 'Use caution' : 'Not recommended'} for under {aiData[query.trim()]!.ageRecommendation}s
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: Spacing.sm }}>{aiData[query.trim()]!.summary}</Text>
                  {aiData[query.trim()]!.themes.length > 0 && (
                    <View style={[styles.tagWrap, { marginBottom: Spacing.sm }]}>
                      {aiData[query.trim()]!.themes.map((t) => (
                        <View key={t} style={['positive', 'educational', 'creativity', 'empathy', 'humor'].includes(t) ? styles.safeTag : styles.dangerTag}>
                          <Text style={['positive', 'educational', 'creativity', 'empathy', 'humor'].includes(t) ? styles.safeTagText : styles.dangerTagText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={{ fontSize: 12, color: '#4c1d95', fontWeight: '500', marginBottom: Spacing.md }}>{aiData[query.trim()]!.parentAdvice}</Text>
                  <Text style={{ fontSize: 10, color: '#9ca3af' }}>Generated from AI and internet insights · Not a community rating</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                  {aiLoading ? (
                    <View style={{ alignItems: 'center' }}>
                      <ActivityIndicator size="small" color={Colors.accent} />
                      <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: Spacing.sm }}>Generating safety assessment...</Text>
                    </View>
                  ) : (
                    <Text style={styles.noOfficialHint}>Searching for insights...</Text>
                  )}
                </View>
              )}
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={() => router.push({ pathname: '/rate-creator', params: { name: query.trim() } })}
              >
                <Text style={styles.rateBtnText}>Be the first to review</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📡</Text>
              <Text style={styles.emptyText}>No content found</Text>
              <Text style={styles.emptyHint}>Try searching for a game, show, or creator</Text>
            </View>
          )
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
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchInput: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: '#e5e7eb',
  },
  searchBtn: { backgroundColor: '#7c3aed', borderRadius: Radius.md, paddingHorizontal: 18, height: 48, justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  searchingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  searchingText: { fontSize: 12, color: '#9ca3af' },

  // Filters
  filterScroll: { flexGrow: 0, marginBottom: Spacing.md },
  filterContent: { paddingHorizontal: Spacing.lg, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: Colors.accent + '20', borderColor: Colors.accent + '40' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
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

  // Community ratings section
  communitySection: {
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  bracketRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  bracketLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, width: 70 },
  bracketBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  bracketText: { fontSize: 12, fontWeight: '700' },
  communityNote: { fontSize: 12, color: Colors.textDim, fontStyle: 'italic', lineHeight: 18, marginBottom: 4 },
  communityCount: { fontSize: 11, color: Colors.textMute, marginTop: Spacing.sm },

  // Rate button
  rateBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.accentLight,
    borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accent + '30',
  },
  rateBtnText: { fontSize: 14, fontWeight: '700', color: Colors.accent },

  // No official rating fallback
  noOfficialWrap: { padding: Spacing.lg, alignItems: 'center' },
  noOfficialTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: Spacing.md },
  noOfficialHint: { fontSize: 13, color: Colors.textMute, marginBottom: Spacing.md },
  communityFallbackCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, width: '100%', marginBottom: Spacing.md,
  },
  communityFallbackHeading: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },

  // Empty
  empty: { padding: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  emptyHint: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
});
