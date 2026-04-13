/**
 * Community Ratings Engine — lets parents rate creators/channels
 * and aggregates those ratings into per-age-bracket risk assessments.
 *
 * Storage: AsyncStorage (device-local) + Web3Forms (email relay to Tanya).
 * In production: replace with Supabase + real-time aggregation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── INTERFACES ──────────────────────────────────────────────

export interface CommunityRating {
  creatorName: string;
  ageRecommendation: number;
  themes: string[];
  wouldLetChildWatch: 'yes' | 'with_discussion' | 'no';
  parentNote: string;
  childAge: number;
  timestamp: string;
}

export type AgeBracket = '8-10' | '11-13' | '14-16';
export type RiskLevel = 'safe' | 'caution' | 'not_recommended';

export interface AggregatedRating {
  creatorName: string;
  totalRatings: number;
  ageBracketScores: Record<AgeBracket, { risk: RiskLevel; percentage: number }>;
  topThemes: string[];
  sampleNotes: string[];
}

// ── STORAGE HELPERS ─────────────────────────────────────────

const STORAGE_KEY = 'custorian_community_ratings';

async function loadAll(): Promise<CommunityRating[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveAll(ratings: CommunityRating[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
}

// ── PUBLIC API ──────────────────────────────────────────────

/**
 * Submit a parent rating. Saves locally AND sends to Web3Forms.
 */
export async function submitRating(rating: CommunityRating): Promise<void> {
  // Persist locally
  const all = await loadAll();
  all.push(rating);
  await saveAll(all);

  // Send to Web3Forms (fire-and-forget)
  try {
    const formData = new FormData();
    formData.append('access_key', 'cfeb795c-19e4-42ee-9ab3-66290e1c5e34');
    formData.append('subject', 'Custorian Creator Rating');
    formData.append('creator_name', rating.creatorName);
    formData.append('age_recommendation', String(rating.ageRecommendation));
    formData.append('themes', rating.themes.join(', '));
    formData.append('would_let_child_watch', rating.wouldLetChildWatch);
    formData.append('parent_note', rating.parentNote);
    formData.append('child_age', String(rating.childAge));
    formData.append('timestamp', rating.timestamp);
    formData.append('source', 'app');

    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    });
  } catch {
    // Offline is fine — local copy is saved
  }
}

/**
 * Load all community ratings for a specific creator.
 * Merges seed data with user-submitted ratings.
 */
export async function getRatingsForCreator(name: string): Promise<CommunityRating[]> {
  const key = name.toLowerCase().trim();
  const seed = SEED_RATINGS.filter((r) => r.creatorName.toLowerCase() === key);
  const stored = await loadAll();
  const user = stored.filter((r) => r.creatorName.toLowerCase() === key);
  return [...seed, ...user];
}

/**
 * Synthesize an array of ratings into a single AggregatedRating.
 */
export function aggregateRatings(ratings: CommunityRating[]): AggregatedRating | null {
  if (ratings.length === 0) return null;

  const creatorName = ratings[0].creatorName;

  // Age bracket scoring
  const brackets: AgeBracket[] = ['8-10', '11-13', '14-16'];
  const ageBracketScores = {} as AggregatedRating['ageBracketScores'];

  for (const bracket of brackets) {
    const [lo, hi] = bracket.split('-').map(Number);
    // Ratings where the recommended age is ABOVE the bracket top → not recommended
    // Ratings where rec age is within or below bracket → safer
    let notRecCount = 0;
    let cautionCount = 0;
    let safeCount = 0;

    for (const r of ratings) {
      if (r.ageRecommendation > hi) {
        notRecCount++;
      } else if (r.ageRecommendation > lo) {
        cautionCount++;
      } else {
        safeCount++;
      }
      // Also factor in the explicit "would let child watch" signal
      if (r.childAge >= lo && r.childAge <= hi) {
        if (r.wouldLetChildWatch === 'no') notRecCount++;
        if (r.wouldLetChildWatch === 'with_discussion') cautionCount++;
        if (r.wouldLetChildWatch === 'yes') safeCount++;
      }
    }

    const total = notRecCount + cautionCount + safeCount || 1;
    const notRecPct = Math.round((notRecCount / total) * 100);
    const cautionPct = Math.round((cautionCount / total) * 100);

    let risk: RiskLevel = 'safe';
    let percentage = Math.round((safeCount / total) * 100);
    if (notRecPct >= 50) {
      risk = 'not_recommended';
      percentage = notRecPct;
    } else if (notRecPct + cautionPct >= 50) {
      risk = 'caution';
      percentage = notRecPct + cautionPct;
    } else {
      percentage = Math.round((safeCount / total) * 100);
    }

    ageBracketScores[bracket] = { risk, percentage };
  }

  // Top themes by frequency
  const themeCounts: Record<string, number> = {};
  for (const r of ratings) {
    for (const t of r.themes) {
      themeCounts[t] = (themeCounts[t] || 0) + 1;
    }
  }
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  // Sample notes (up to 3, non-empty)
  const sampleNotes = ratings
    .map((r) => r.parentNote)
    .filter((n) => n.trim().length > 0)
    .slice(0, 3);

  return { creatorName, totalRatings: ratings.length, ageBracketScores, topThemes, sampleNotes };
}

// ── SEED DATA ───────────────────────────────────────────────

const SEED_RATINGS: CommunityRating[] = [
  // ── MrBeast ──
  { creatorName: 'MrBeast', ageRecommendation: 10, themes: ['positive', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'Entertaining and mostly harmless. Consumerism is the only watch-out.', childAge: 10, timestamp: '2026-01-15T08:00:00Z' },
  { creatorName: 'MrBeast', ageRecommendation: 8, themes: ['positive', 'educational'], wouldLetChildWatch: 'yes', parentNote: 'My kids love it. Some stunts are intense but nothing harmful.', childAge: 9, timestamp: '2026-01-20T12:30:00Z' },
  { creatorName: 'MrBeast', ageRecommendation: 10, themes: ['positive', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'Good content overall. Watch out for brand promotion.', childAge: 11, timestamp: '2026-02-01T09:15:00Z' },
  { creatorName: 'MrBeast', ageRecommendation: 9, themes: ['positive'], wouldLetChildWatch: 'yes', parentNote: 'Fun challenges. Nothing offensive.', childAge: 8, timestamp: '2026-02-10T14:00:00Z' },
  { creatorName: 'MrBeast', ageRecommendation: 12, themes: ['positive', 'gambling'], wouldLetChildWatch: 'with_discussion', parentNote: 'Some videos feel like gambling for kids — huge cash prizes normalize money obsession.', childAge: 12, timestamp: '2026-02-15T10:45:00Z' },
  { creatorName: 'MrBeast', ageRecommendation: 10, themes: ['positive', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'Generally good but discuss the money aspect.', childAge: 10, timestamp: '2026-03-01T08:20:00Z' },
  { creatorName: 'MrBeast', ageRecommendation: 11, themes: ['positive'], wouldLetChildWatch: 'with_discussion', parentNote: 'Too focused on material rewards.', childAge: 13, timestamp: '2026-03-10T17:30:00Z' },

  // ── Andrew Tate ──
  { creatorName: 'Andrew Tate', ageRecommendation: 18, themes: ['violence', 'profanity', 'body-image'], wouldLetChildWatch: 'no', parentNote: 'Dangerous influence on boys. Promotes toxic masculinity and misogyny.', childAge: 14, timestamp: '2026-01-10T09:00:00Z' },
  { creatorName: 'Andrew Tate', ageRecommendation: 18, themes: ['violence', 'profanity', 'bullying'], wouldLetChildWatch: 'no', parentNote: 'Absolutely not. Under investigation for trafficking. Why is he still platformed?', childAge: 15, timestamp: '2026-01-18T11:20:00Z' },
  { creatorName: 'Andrew Tate', ageRecommendation: 18, themes: ['violence', 'profanity', 'body-image', 'bullying'], wouldLetChildWatch: 'no', parentNote: 'My son started repeating his talking points. Had to have a serious conversation.', childAge: 13, timestamp: '2026-01-25T14:45:00Z' },
  { creatorName: 'Andrew Tate', ageRecommendation: 18, themes: ['violence', 'profanity'], wouldLetChildWatch: 'no', parentNote: 'Not suitable for anyone under 18.', childAge: 16, timestamp: '2026-02-05T08:30:00Z' },
  { creatorName: 'Andrew Tate', ageRecommendation: 18, themes: ['profanity', 'bullying', 'body-image'], wouldLetChildWatch: 'no', parentNote: 'Harmful content glorifying aggression and control over women.', childAge: 12, timestamp: '2026-02-20T16:00:00Z' },
  { creatorName: 'Andrew Tate', ageRecommendation: 18, themes: ['violence', 'profanity', 'body-image'], wouldLetChildWatch: 'no', parentNote: 'Red flag content. Discuss with your kids before they find it themselves.', childAge: 14, timestamp: '2026-03-01T10:10:00Z' },
  { creatorName: 'Andrew Tate', ageRecommendation: 16, themes: ['profanity', 'body-image'], wouldLetChildWatch: 'with_discussion', parentNote: 'Used his videos as a teaching moment on media literacy with my 16yo.', childAge: 16, timestamp: '2026-03-12T13:00:00Z' },
  { creatorName: 'Andrew Tate', ageRecommendation: 18, themes: ['violence', 'profanity', 'bullying'], wouldLetChildWatch: 'no', parentNote: 'No discussion needed — just no.', childAge: 11, timestamp: '2026-03-20T09:30:00Z' },

  // ── IShowSpeed ──
  { creatorName: 'IShowSpeed', ageRecommendation: 14, themes: ['profanity', 'violence'], wouldLetChildWatch: 'no', parentNote: 'Way too much screaming and swearing for younger kids.', childAge: 10, timestamp: '2026-01-12T10:00:00Z' },
  { creatorName: 'IShowSpeed', ageRecommendation: 14, themes: ['profanity', 'positive'], wouldLetChildWatch: 'with_discussion', parentNote: 'Energetic but the language is rough. Discuss boundaries.', childAge: 13, timestamp: '2026-01-22T15:30:00Z' },
  { creatorName: 'IShowSpeed', ageRecommendation: 16, themes: ['profanity', 'violence', 'body-image'], wouldLetChildWatch: 'no', parentNote: 'Dangerous stunts and unhinged behavior. Not a role model.', childAge: 11, timestamp: '2026-02-03T08:45:00Z' },
  { creatorName: 'IShowSpeed', ageRecommendation: 13, themes: ['profanity'], wouldLetChildWatch: 'with_discussion', parentNote: 'My teen watches him. Over-the-top but not hateful.', childAge: 14, timestamp: '2026-02-14T12:00:00Z' },
  { creatorName: 'IShowSpeed', ageRecommendation: 15, themes: ['profanity', 'violence'], wouldLetChildWatch: 'no', parentNote: 'Set fireworks off in his room. Kids will imitate.', childAge: 9, timestamp: '2026-02-28T17:15:00Z' },
  { creatorName: 'IShowSpeed', ageRecommendation: 14, themes: ['profanity'], wouldLetChildWatch: 'with_discussion', parentNote: 'Entertaining for teens but younger ones should skip.', childAge: 15, timestamp: '2026-03-05T09:00:00Z' },

  // ── Cocomelon ──
  { creatorName: 'Cocomelon', ageRecommendation: 8, themes: ['educational', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Great for toddlers. Repetitive songs but educational.', childAge: 8, timestamp: '2026-01-05T07:00:00Z' },
  { creatorName: 'Cocomelon', ageRecommendation: 8, themes: ['educational', 'positive', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'Perfect for under 5s. Colorful and safe.', childAge: 8, timestamp: '2026-01-15T09:30:00Z' },
  { creatorName: 'Cocomelon', ageRecommendation: 8, themes: ['educational', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Only concern is screen addiction — the pacing is very fast.', childAge: 8, timestamp: '2026-01-28T11:00:00Z' },
  { creatorName: 'Cocomelon', ageRecommendation: 8, themes: ['educational'], wouldLetChildWatch: 'yes', parentNote: 'Safe content but limit screen time.', childAge: 9, timestamp: '2026-02-10T08:15:00Z' },
  { creatorName: 'Cocomelon', ageRecommendation: 8, themes: ['educational', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Harmless. My kids outgrew it by age 4.', childAge: 8, timestamp: '2026-02-22T14:30:00Z' },
  { creatorName: 'Cocomelon', ageRecommendation: 8, themes: ['educational', 'positive'], wouldLetChildWatch: 'with_discussion', parentNote: 'Studies suggest overstimulation. Use in moderation.', childAge: 8, timestamp: '2026-03-08T10:00:00Z' },

  // ── Mark Rober ──
  { creatorName: 'Mark Rober', ageRecommendation: 8, themes: ['educational', 'creativity', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Best STEM content on YouTube. My kids build things after watching.', childAge: 10, timestamp: '2026-01-08T08:00:00Z' },
  { creatorName: 'Mark Rober', ageRecommendation: 8, themes: ['educational', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'Wish all YouTube was this good. Science-first, zero drama.', childAge: 9, timestamp: '2026-01-19T13:45:00Z' },
  { creatorName: 'Mark Rober', ageRecommendation: 8, themes: ['educational', 'creativity', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Former NASA engineer making science cool. Yes please.', childAge: 11, timestamp: '2026-02-02T10:30:00Z' },
  { creatorName: 'Mark Rober', ageRecommendation: 8, themes: ['educational', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Highly recommended. Inspires curiosity.', childAge: 8, timestamp: '2026-02-15T09:00:00Z' },
  { creatorName: 'Mark Rober', ageRecommendation: 8, themes: ['educational', 'creativity', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Glitter bomb videos are hilarious and teach engineering principles.', childAge: 12, timestamp: '2026-02-28T16:20:00Z' },
  { creatorName: 'Mark Rober', ageRecommendation: 9, themes: ['educational', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'A few videos have mild pranks but overall stellar content.', childAge: 10, timestamp: '2026-03-10T11:00:00Z' },
  { creatorName: 'Mark Rober', ageRecommendation: 8, themes: ['educational', 'creativity', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Gold standard for kids YouTube.', childAge: 13, timestamp: '2026-03-18T14:15:00Z' },
];
