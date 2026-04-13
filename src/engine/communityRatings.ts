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

  // ── Roblox ──
  { creatorName: 'Roblox', ageRecommendation: 9, themes: ['creativity', 'gambling'], wouldLetChildWatch: 'with_discussion', parentNote: 'Good creativity tool but Robux spending is out of control. Set purchase limits.', childAge: 9, timestamp: '2026-01-15T10:00:00Z' },
  { creatorName: 'Roblox', ageRecommendation: 10, themes: ['creativity', 'sexual'], wouldLetChildWatch: 'with_discussion', parentNote: 'Some user-created games have shocking content. Monitor which games they play.', childAge: 11, timestamp: '2026-01-25T14:00:00Z' },
  { creatorName: 'Roblox', ageRecommendation: 7, themes: ['creativity', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'My kid builds amazing things. Just watch the chat.', childAge: 8, timestamp: '2026-02-10T08:00:00Z' },
  { creatorName: 'Roblox', ageRecommendation: 12, themes: ['gambling', 'bullying'], wouldLetChildWatch: 'with_discussion', parentNote: 'Predators in chat. Always supervise younger kids.', childAge: 10, timestamp: '2026-02-20T16:00:00Z' },
  { creatorName: 'Roblox', ageRecommendation: 8, themes: ['creativity', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Better than most alternatives. Teach them about online stranger danger.', childAge: 9, timestamp: '2026-03-05T12:00:00Z' },

  // ── Fortnite ──
  { creatorName: 'Fortnite', ageRecommendation: 12, themes: ['violence'], wouldLetChildWatch: 'with_discussion', parentNote: 'Cartoon violence but the voice chat is toxic. Mute strangers.', childAge: 11, timestamp: '2026-01-20T09:00:00Z' },
  { creatorName: 'Fortnite', ageRecommendation: 10, themes: ['violence', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Not realistic violence. My kids play with friends and have fun.', childAge: 10, timestamp: '2026-02-01T15:00:00Z' },
  { creatorName: 'Fortnite', ageRecommendation: 13, themes: ['violence', 'gambling'], wouldLetChildWatch: 'with_discussion', parentNote: 'V-Bucks spending is basically gambling for kids. Set a monthly limit.', childAge: 12, timestamp: '2026-02-15T11:00:00Z' },
  { creatorName: 'Fortnite', ageRecommendation: 12, themes: ['violence'], wouldLetChildWatch: 'with_discussion', parentNote: 'Fine for teens. Too intense for under 10.', childAge: 14, timestamp: '2026-03-01T13:00:00Z' },
  { creatorName: 'Fortnite', ageRecommendation: 11, themes: ['violence', 'positive', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'Creative mode is great. Battle royale needs supervision for younger kids.', childAge: 11, timestamp: '2026-03-10T08:00:00Z' },

  // ── Minecraft ──
  { creatorName: 'Minecraft', ageRecommendation: 7, themes: ['creativity', 'educational', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Best game for kids. Period. Teaches problem solving and creativity.', childAge: 8, timestamp: '2026-01-10T09:00:00Z' },
  { creatorName: 'Minecraft', ageRecommendation: 7, themes: ['creativity', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'My kids have been playing for years. Educational and engaging.', childAge: 10, timestamp: '2026-01-20T14:00:00Z' },
  { creatorName: 'Minecraft', ageRecommendation: 8, themes: ['creativity', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'Public servers can have toxic chat. Use private worlds.', childAge: 9, timestamp: '2026-02-05T11:00:00Z' },
  { creatorName: 'Minecraft', ageRecommendation: 6, themes: ['educational', 'creativity', 'positive'], wouldLetChildWatch: 'yes', parentNote: 'My 6yo loves it in creative mode. Zero concerns.', childAge: 6, timestamp: '2026-02-25T10:00:00Z' },
  { creatorName: 'Minecraft', ageRecommendation: 7, themes: ['creativity', 'positive', 'educational'], wouldLetChildWatch: 'yes', parentNote: 'Survival mode teaches resource management. Brilliant.', childAge: 11, timestamp: '2026-03-15T15:00:00Z' },

  // ── TikTok ──
  { creatorName: 'TikTok', ageRecommendation: 16, themes: ['body-image', 'sexual', 'bullying'], wouldLetChildWatch: 'no', parentNote: 'Algorithm pushes harmful content to kids. Pro-ana, sexual content within minutes.', childAge: 13, timestamp: '2026-01-12T10:00:00Z' },
  { creatorName: 'TikTok', ageRecommendation: 14, themes: ['body-image', 'bullying'], wouldLetChildWatch: 'with_discussion', parentNote: 'My daughter developed body image issues from TikTok. Now strictly supervised.', childAge: 14, timestamp: '2026-01-28T16:00:00Z' },
  { creatorName: 'TikTok', ageRecommendation: 16, themes: ['sexual', 'violence', 'body-image'], wouldLetChildWatch: 'no', parentNote: 'No child under 16 should be on TikTok unsupervised.', childAge: 12, timestamp: '2026-02-10T09:00:00Z' },
  { creatorName: 'TikTok', ageRecommendation: 13, themes: ['body-image'], wouldLetChildWatch: 'with_discussion', parentNote: 'Restricted mode helps but doesnt catch everything.', childAge: 13, timestamp: '2026-02-22T14:00:00Z' },
  { creatorName: 'TikTok', ageRecommendation: 18, themes: ['sexual', 'body-image', 'violence', 'drugs'], wouldLetChildWatch: 'no', parentNote: 'Found my 11yo watching self-harm content. Deleted immediately.', childAge: 11, timestamp: '2026-03-08T08:00:00Z' },

  // ── Discord ──
  { creatorName: 'Discord', ageRecommendation: 14, themes: ['sexual', 'violence', 'bullying'], wouldLetChildWatch: 'with_discussion', parentNote: 'Public servers are the wild west. Private servers with friends only.', childAge: 13, timestamp: '2026-01-15T11:00:00Z' },
  { creatorName: 'Discord', ageRecommendation: 16, themes: ['sexual', 'violence'], wouldLetChildWatch: 'no', parentNote: 'Predators actively target kids on Discord gaming servers.', childAge: 12, timestamp: '2026-02-01T14:00:00Z' },
  { creatorName: 'Discord', ageRecommendation: 13, themes: ['positive', 'creativity'], wouldLetChildWatch: 'with_discussion', parentNote: 'Great for friend groups if you control which servers they join.', childAge: 14, timestamp: '2026-02-20T09:00:00Z' },
  { creatorName: 'Discord', ageRecommendation: 15, themes: ['sexual', 'bullying'], wouldLetChildWatch: 'with_discussion', parentNote: 'Review their server list regularly.', childAge: 15, timestamp: '2026-03-10T16:00:00Z' },

  // ── Snapchat ──
  { creatorName: 'Snapchat', ageRecommendation: 16, themes: ['sexual', 'bullying', 'body-image'], wouldLetChildWatch: 'no', parentNote: 'Disappearing messages make it impossible to monitor. Major predator tool.', childAge: 13, timestamp: '2026-01-20T10:00:00Z' },
  { creatorName: 'Snapchat', ageRecommendation: 15, themes: ['sexual', 'body-image'], wouldLetChildWatch: 'with_discussion', parentNote: 'Location sharing is dangerous. Turn off Snap Map.', childAge: 14, timestamp: '2026-02-10T13:00:00Z' },
  { creatorName: 'Snapchat', ageRecommendation: 16, themes: ['sexual'], wouldLetChildWatch: 'no', parentNote: 'Sextortion cases almost always involve Snapchat.', childAge: 12, timestamp: '2026-02-28T08:00:00Z' },
  { creatorName: 'Snapchat', ageRecommendation: 14, themes: ['body-image'], wouldLetChildWatch: 'with_discussion', parentNote: 'Filters give kids unrealistic beauty standards.', childAge: 15, timestamp: '2026-03-15T15:00:00Z' },

  // ── Bluey ──
  { creatorName: 'Bluey', ageRecommendation: 3, themes: ['positive', 'educational', 'creativity', 'empathy'], wouldLetChildWatch: 'yes', parentNote: 'Best kids show ever made. We watch it as a family.', childAge: 5, timestamp: '2026-01-10T09:00:00Z' },
  { creatorName: 'Bluey', ageRecommendation: 2, themes: ['positive', 'educational', 'empathy'], wouldLetChildWatch: 'yes', parentNote: 'Teaches emotional intelligence better than any parenting book.', childAge: 4, timestamp: '2026-01-25T14:00:00Z' },
  { creatorName: 'Bluey', ageRecommendation: 3, themes: ['positive', 'creativity', 'empathy'], wouldLetChildWatch: 'yes', parentNote: 'I cry more than my kids watching this.', childAge: 7, timestamp: '2026-02-15T11:00:00Z' },
  { creatorName: 'Bluey', ageRecommendation: 2, themes: ['positive', 'educational'], wouldLetChildWatch: 'yes', parentNote: 'Perfect. No notes.', childAge: 3, timestamp: '2026-03-01T08:00:00Z' },

  // ── Squid Game ──
  { creatorName: 'Squid Game', ageRecommendation: 18, themes: ['violence', 'gambling'], wouldLetChildWatch: 'no', parentNote: 'Graphic violence, death, organ harvesting. Not for children.', childAge: 14, timestamp: '2026-01-12T10:00:00Z' },
  { creatorName: 'Squid Game', ageRecommendation: 16, themes: ['violence', 'gambling'], wouldLetChildWatch: 'no', parentNote: 'My 10yo saw clips on YouTube. Nightmares for a week.', childAge: 10, timestamp: '2026-01-30T15:00:00Z' },
  { creatorName: 'Squid Game', ageRecommendation: 18, themes: ['violence', 'gambling', 'sexual'], wouldLetChildWatch: 'no', parentNote: 'Every parent should know: this is NOT a kids show despite the playground games.', childAge: 12, timestamp: '2026-02-20T09:00:00Z' },
  { creatorName: 'Squid Game', ageRecommendation: 16, themes: ['violence'], wouldLetChildWatch: 'with_discussion', parentNote: 'Watched with my 16yo. Good discussion about inequality and desperation.', childAge: 16, timestamp: '2026-03-05T14:00:00Z' },

  // ── KSI ──
  { creatorName: 'KSI', ageRecommendation: 14, themes: ['profanity', 'violence'], wouldLetChildWatch: 'with_discussion', parentNote: 'Lots of swearing and boxing content but generally not harmful for teens.', childAge: 14, timestamp: '2026-02-01T10:00:00Z' },
  { creatorName: 'KSI', ageRecommendation: 13, themes: ['profanity'], wouldLetChildWatch: 'with_discussion', parentNote: 'Prime energy drink marketing to kids is concerning.', childAge: 12, timestamp: '2026-02-15T14:00:00Z' },
  { creatorName: 'KSI', ageRecommendation: 15, themes: ['profanity', 'gambling'], wouldLetChildWatch: 'with_discussion', parentNote: 'Sidemen content is mostly harmless. Solo KSI more adult.', childAge: 15, timestamp: '2026-03-01T09:00:00Z' },

  // ── PewDiePie ──
  { creatorName: 'PewDiePie', ageRecommendation: 14, themes: ['profanity'], wouldLetChildWatch: 'with_discussion', parentNote: 'Mellowed out a lot in recent years. Fine for teens.', childAge: 14, timestamp: '2026-01-20T11:00:00Z' },
  { creatorName: 'PewDiePie', ageRecommendation: 13, themes: ['profanity'], wouldLetChildWatch: 'yes', parentNote: 'Much calmer than he used to be. Gaming commentary is fine.', childAge: 13, timestamp: '2026-02-10T15:00:00Z' },
  { creatorName: 'PewDiePie', ageRecommendation: 12, themes: ['positive'], wouldLetChildWatch: 'yes', parentNote: 'Retired from daily content. What remains is pretty wholesome.', childAge: 12, timestamp: '2026-03-05T10:00:00Z' },

  // ── Dude Perfect ──
  { creatorName: 'Dude Perfect', ageRecommendation: 7, themes: ['positive', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'Clean, family-friendly, entertaining trick shots. No concerns.', childAge: 8, timestamp: '2026-01-15T09:00:00Z' },
  { creatorName: 'Dude Perfect', ageRecommendation: 6, themes: ['positive'], wouldLetChildWatch: 'yes', parentNote: 'One of the few channels I let my kids watch unsupervised.', childAge: 7, timestamp: '2026-02-01T13:00:00Z' },
  { creatorName: 'Dude Perfect', ageRecommendation: 7, themes: ['positive', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'Great role models. Clean fun.', childAge: 10, timestamp: '2026-03-01T08:00:00Z' },

  // ── Stranger Things ──
  { creatorName: 'Stranger Things', ageRecommendation: 13, themes: ['violence', 'positive', 'empathy'], wouldLetChildWatch: 'with_discussion', parentNote: 'Scary but age-appropriate for teens. Strong friendship themes.', childAge: 13, timestamp: '2026-01-25T14:00:00Z' },
  { creatorName: 'Stranger Things', ageRecommendation: 14, themes: ['violence'], wouldLetChildWatch: 'with_discussion', parentNote: 'Season 4 is significantly darker. Later seasons need older kids.', childAge: 14, timestamp: '2026-02-15T10:00:00Z' },
  { creatorName: 'Stranger Things', ageRecommendation: 12, themes: ['positive', 'empathy', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'Season 1 is fine for 12+. Gets progressively more violent.', childAge: 12, timestamp: '2026-03-10T15:00:00Z' },

  // ── GTA V ──
  { creatorName: 'GTA V', ageRecommendation: 18, themes: ['violence', 'sexual', 'drugs', 'profanity'], wouldLetChildWatch: 'no', parentNote: 'Torture scenes, strip clubs, drug use. Not for children. At all.', childAge: 14, timestamp: '2026-01-20T10:00:00Z' },
  { creatorName: 'GTA V', ageRecommendation: 18, themes: ['violence', 'sexual', 'drugs'], wouldLetChildWatch: 'no', parentNote: 'Most played game by kids who shouldnt be playing it.', childAge: 11, timestamp: '2026-02-05T14:00:00Z' },
  { creatorName: 'GTA V', ageRecommendation: 16, themes: ['violence', 'drugs'], wouldLetChildWatch: 'with_discussion', parentNote: 'My 16yo plays online only. We discussed the single player content.', childAge: 16, timestamp: '2026-02-28T09:00:00Z' },
  { creatorName: 'GTA V', ageRecommendation: 18, themes: ['violence', 'sexual', 'drugs', 'profanity'], wouldLetChildWatch: 'no', parentNote: 'If your kid is playing this under 16, you need to know.', childAge: 12, timestamp: '2026-03-15T11:00:00Z' },

  // ── Skibidi Toilet ──
  { creatorName: 'Skibidi Toilet', ageRecommendation: 7, themes: ['violence'], wouldLetChildWatch: 'yes', parentNote: 'Weird but harmless. Every kid watches it. Pick your battles.', childAge: 8, timestamp: '2026-01-10T09:00:00Z' },
  { creatorName: 'Skibidi Toilet', ageRecommendation: 8, themes: ['violence'], wouldLetChildWatch: 'yes', parentNote: 'Low educational value but not harmful. Just bizarre.', childAge: 9, timestamp: '2026-02-01T14:00:00Z' },
  { creatorName: 'Skibidi Toilet', ageRecommendation: 6, themes: ['positive'], wouldLetChildWatch: 'yes', parentNote: 'Banning it made my kid want it more. Now its just background noise.', childAge: 7, timestamp: '2026-02-20T10:00:00Z' },

  // ── Among Us ──
  { creatorName: 'Among Us', ageRecommendation: 9, themes: ['positive', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'Great social game. Use private lobbies — public chat can be inappropriate.', childAge: 10, timestamp: '2026-01-15T11:00:00Z' },
  { creatorName: 'Among Us', ageRecommendation: 8, themes: ['positive'], wouldLetChildWatch: 'yes', parentNote: 'Teaches deduction skills. Fun with friends.', childAge: 9, timestamp: '2026-02-10T09:00:00Z' },
  { creatorName: 'Among Us', ageRecommendation: 10, themes: ['positive', 'creativity'], wouldLetChildWatch: 'yes', parentNote: 'Quick chat mode is safer for younger kids.', childAge: 8, timestamp: '2026-03-05T14:00:00Z' },

  // ── YouTube Kids ──
  { creatorName: 'YouTube Kids', ageRecommendation: 5, themes: ['positive', 'educational'], wouldLetChildWatch: 'yes', parentNote: 'Much safer than regular YouTube. Not perfect but good enough.', childAge: 6, timestamp: '2026-01-20T10:00:00Z' },
  { creatorName: 'YouTube Kids', ageRecommendation: 4, themes: ['positive'], wouldLetChildWatch: 'yes', parentNote: 'Some weird autoplay content slips through. Check history occasionally.', childAge: 5, timestamp: '2026-02-15T14:00:00Z' },
  { creatorName: 'YouTube Kids', ageRecommendation: 6, themes: ['positive', 'educational'], wouldLetChildWatch: 'yes', parentNote: 'Better than regular YouTube for under 8s. Definitely use this instead.', childAge: 7, timestamp: '2026-03-01T09:00:00Z' },
];
