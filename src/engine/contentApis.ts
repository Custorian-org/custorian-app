/**
 * External API integrations for Content Radar.
 * Connects to free APIs for real-time content ratings and info.
 *
 * APIs used:
 * - TMDB (movies/shows): https://www.themoviedb.org/settings/api — free, sign up
 * - RAWG (games): https://rawg.io/apidocs — free, sign up
 * - YouTube Data API: https://console.cloud.google.com — free tier
 *
 * All API keys go in .env — never hardcoded.
 */

import { ContentEntry, ContentType, ThemeTag } from './contentRadar';

// ── API KEYS (loaded from .env via process.env) ──────────
// Expo requires EXPO_PUBLIC_ prefix for client-side access
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_KEY || process.env.TMDB_API_KEY || '';
const RAWG_API_KEY = process.env.EXPO_PUBLIC_RAWG_KEY || process.env.RAWG_API_KEY || '';
const YOUTUBE_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_KEY || process.env.YOUTUBE_API_KEY || '';
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || '';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const RAWG_BASE = 'https://api.rawg.io/api';
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// ── TMDB: Movies & TV Shows ─────────────────────────────────

interface TmdbResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  vote_average: number;
  genre_ids: number[];
  release_date?: string;
  first_air_date?: string;
}

// TMDB genre ID → our theme tags
const TMDB_GENRE_MAP: Record<number, ThemeTag[]> = {
  28: ['violence'],        // Action
  27: ['horror', 'violence'], // Horror
  53: ['violence'],        // Thriller
  80: ['violence'],        // Crime
  10752: ['violence', 'gore'], // War
  10749: ['sexual'],       // Romance (flag for young kids)
  16: ['creativity'],      // Animation
  35: ['humor'],           // Comedy
  99: ['educational'],     // Documentary
  10751: ['positive'],     // Family
};

// TMDB content rating → minimum age
const TMDB_RATING_AGE: Record<string, number> = {
  'G': 0, 'TV-Y': 0, 'TV-Y7': 7, 'TV-G': 0,
  'PG': 8, 'TV-PG': 8,
  'PG-13': 13, 'TV-14': 14,
  'R': 17, 'TV-MA': 17, 'NC-17': 18,
};

export async function searchTmdb(query: string): Promise<ContentEntry[]> {
  if (!TMDB_API_KEY) return [];

  try {
    const res = await fetch(
      `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
    );
    const data = await res.json();

    const results: ContentEntry[] = [];
    for (const item of (data.results || []).slice(0, 5)) {
      const type: ContentType = item.media_type === 'tv' ? 'show' : 'movie';
      const name = item.title || item.name || 'Unknown';

      // Get content rating
      const rating = await getTmdbRating(item.id, item.media_type);
      const ageRating = TMDB_RATING_AGE[rating] ?? 13;

      // Map genres to themes
      const themes: ThemeTag[] = [];
      for (const genreId of item.genre_ids || []) {
        themes.push(...(TMDB_GENRE_MAP[genreId] || []));
      }

      results.push({
        name,
        type,
        ageRating,
        officialRating: rating || 'Not Rated',
        themes: [...new Set(themes)],
        parentNote: item.overview?.substring(0, 200) || 'No description available.',
        alternatives: [],
      });
    }
    return results;
  } catch {
    return [];
  }
}

async function getTmdbRating(id: number, mediaType: string): Promise<string> {
  try {
    const endpoint = mediaType === 'tv' ? 'content_ratings' : 'release_dates';
    const res = await fetch(
      `${TMDB_BASE}/${mediaType}/${id}/${endpoint}?api_key=${TMDB_API_KEY}`
    );
    const data = await res.json();

    if (mediaType === 'tv') {
      // Find US or DK rating
      const us = data.results?.find((r: any) => r.iso_3166_1 === 'US');
      return us?.rating || '';
    } else {
      const us = data.results?.find((r: any) => r.iso_3166_1 === 'US');
      const cert = us?.release_dates?.[0]?.certification;
      return cert || '';
    }
  } catch {
    return '';
  }
}

// ── RAWG: Games ──────────────────────────────────────────────

interface RawgResult {
  id: number;
  name: string;
  esrb_rating: { id: number; name: string; slug: string } | null;
  genres: { id: number; name: string }[];
  description_raw?: string;
  tags: { id: number; name: string; slug: string }[];
}

const ESRB_AGE: Record<string, number> = {
  'everyone': 6, 'everyone-10-plus': 10, 'teen': 13, 'mature': 17, 'adults-only': 18,
};

const RAWG_TAG_MAP: Record<string, ThemeTag> = {
  'violent': 'violence', 'gore': 'gore', 'sexual-content': 'sexual',
  'nudity': 'nudity', 'drugs': 'drugs', 'gambling': 'gambling',
  'horror': 'horror', 'co-op': 'teamwork', 'educational': 'educational',
  'puzzle': 'problem-solving', 'creative': 'creativity',
};

export async function searchRawg(query: string): Promise<ContentEntry[]> {
  if (!RAWG_API_KEY) return [];

  try {
    const res = await fetch(
      `${RAWG_BASE}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5`
    );
    const data = await res.json();

    return (data.results || []).map((game: RawgResult): ContentEntry => {
      const esrb = game.esrb_rating?.slug || '';
      const ageRating = ESRB_AGE[esrb] ?? 13;

      const themes: ThemeTag[] = [];
      for (const tag of game.tags || []) {
        const mapped = RAWG_TAG_MAP[tag.slug];
        if (mapped) themes.push(mapped);
      }

      return {
        name: game.name,
        type: 'game',
        ageRating,
        officialRating: game.esrb_rating?.name || 'Not Rated',
        themes: [...new Set(themes)],
        parentNote: (game.description_raw || 'No description available.').substring(0, 200),
        alternatives: [],
      };
    });
  } catch {
    return [];
  }
}

// ── YouTube Data API ─────────────────────────────────────────

interface YtSearchResult {
  id: { videoId?: string; channelId?: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
  };
}

interface YtVideoDetails {
  contentDetails: {
    contentRating?: {
      ytRating?: string; // ytAgeRestricted
    };
  };
  statistics: {
    viewCount: string;
  };
}

export async function searchYoutube(query: string): Promise<ContentEntry[]> {
  if (!YOUTUBE_API_KEY) return [];

  try {
    const res = await fetch(
      `${YT_BASE}/search?key=${YOUTUBE_API_KEY}&q=${encodeURIComponent(query)}&part=snippet&type=video,channel&maxResults=5&safeSearch=strict`
    );
    const data = await res.json();

    return (data.items || []).map((item: YtSearchResult): ContentEntry => {
      const name = item.snippet.title;
      const desc = item.snippet.description;

      // Basic theme detection from title/description
      const themes: ThemeTag[] = [];
      const lower = (name + ' ' + desc).toLowerCase();
      if (/violen|fight|kill|gun|weapon/.test(lower)) themes.push('violence');
      if (/horror|scary|creepy/.test(lower)) themes.push('horror');
      if (/learn|educat|science|math/.test(lower)) themes.push('educational');
      if (/cook|bak|recipe|food/.test(lower)) themes.push('creativity');
      if (/challenge|dare|prank/.test(lower)) themes.push('risk-taking');

      return {
        name,
        type: 'youtube',
        ageRating: 10, // Default — refine with video details API
        officialRating: 'YouTube',
        themes: [...new Set(themes)],
        parentNote: desc.substring(0, 200) || 'No description.',
        alternatives: [],
      };
    });
  } catch {
    return [];
  }
}

// ── TikTok / General AI Search (via Gemini) ─────────────────

export async function searchViaAI(query: string, type?: ContentType): Promise<ContentEntry[]> {
  if (!GEMINI_KEY) return [];

  const typeHint = type === 'tiktok' ? 'TikTok creator/account'
    : type === 'app' ? 'mobile app'
    : type === 'platform' ? 'social media platform'
    : 'content creator, app, game, show, or platform';

  try {
    const prompt = `You are a child safety content rating expert. Search your knowledge for "${query}" as a ${typeHint}.

Return a JSON array of up to 5 results. Each result:
{"name":"exact name","type":"game|show|movie|youtube|tiktok|app|platform","ageRating":12,"officialRating":"PEGI 12 or equivalent","themes":["violence","bullying","positive","educational"],"parentNote":"1-2 sentence safety assessment for parents","alternatives":["safer alternative 1","safer alternative 2"]}

Valid themes: violence, gore, sexual, nudity, drugs, gambling, horror, bullying, suicide, eating-disorder, body-image, profanity, predator-risk, radicalization, positive, educational, creativity, teamwork, humor, sextortion, dangerous-challenges, hate-speech, misogyny, stalking.

Be specific and accurate. If unsure, say so in parentNote. Return ONLY valid JSON array, no markdown.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
        }),
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];

    const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    const arr = Array.isArray(parsed) ? parsed : [parsed];

    return arr.map((item: any): ContentEntry => ({
      name: item.name || query,
      type: item.type || type || 'app',
      ageRating: item.ageRating || 13,
      officialRating: item.officialRating || 'AI Assessment',
      themes: (item.themes || []) as ThemeTag[],
      parentNote: item.parentNote || 'AI-generated assessment.',
      alternatives: item.alternatives || [],
    }));
  } catch {
    return [];
  }
}

// ── PLATFORM SAFETY DATABASE ─────────────────────────────────
// Curated safety assessments of major platforms kids use

export const PLATFORM_DATABASE: ContentEntry[] = [
  { name: 'Snapchat', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['predator-risk', 'sexual', 'body-image', 'dangerous-challenges'] as ThemeTag[], parentNote: 'Disappearing messages make oversight difficult. My AI chatbot has engaged inappropriately with minors in testing. Location sharing (Snap Map) is a significant risk.', alternatives: ['iMessage (with Screen Time)', 'WhatsApp (with family group)'] },
  { name: 'TikTok', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['body-image', 'eating-disorder', 'dangerous-challenges', 'predator-risk', 'creativity'] as ThemeTag[], parentNote: 'Algorithm can surface self-harm and eating disorder content to teens within 30 minutes. Strong creative community but For You Page is unpredictable. Restricted Mode helps but is imperfect.', alternatives: ['YouTube Kids', 'Zigazoo'] },
  { name: 'Instagram', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['body-image', 'bullying', 'predator-risk', 'sexual', 'creativity'] as ThemeTag[], parentNote: 'DMs are the primary risk vector. Algorithm amplifies appearance-focused content. Teen accounts have some protections but are easily bypassed by lying about age.', alternatives: ['BeReal', 'VSCO (photography focus)'] },
  { name: 'Facebook', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['predator-risk', 'hate-speech', 'misogyny'] as ThemeTag[], parentNote: 'Less popular with teens but Marketplace and Groups remain risk areas. Messenger Kids is the age-appropriate alternative.', alternatives: ['Messenger Kids'] },
  { name: 'WhatsApp', type: 'app' as ContentType, ageRating: 16, officialRating: '16+', themes: ['predator-risk', 'sextortion'] as ThemeTag[], parentNote: 'End-to-end encryption means no content moderation. #1 platform predators migrate to after initial contact elsewhere. Group chats with strangers are high-risk.', alternatives: ['iMessage (family only)', 'Signal (with parental oversight)'] },
  { name: 'Discord', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['predator-risk', 'violence', 'sexual', 'profanity', 'teamwork'] as ThemeTag[], parentNote: 'Server-based chat used by 65% of teens. Public servers have minimal moderation. Voice channels are unmonitored. Good for gaming communities but high predator risk in public servers.', alternatives: ['Guilded (gaming, better moderation)'] },
  { name: 'Telegram', type: 'app' as ContentType, ageRating: 16, officialRating: '16+', themes: ['predator-risk', 'sexual', 'radicalization', 'drugs'] as ThemeTag[], parentNote: 'Known for minimal moderation. Secret chats are end-to-end encrypted. Widely used for sharing illegal content including CSAM. Not recommended for minors.', alternatives: ['Signal', 'iMessage'] },
  { name: 'X (Twitter)', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['hate-speech', 'sexual', 'violence', 'profanity'] as ThemeTag[], parentNote: 'Adult content allowed since 2024. Moderation significantly reduced. Not recommended for children under 16 regardless of official age rating.', alternatives: ['Bluesky (better moderation)'] },
  { name: 'Reddit', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['sexual', 'violence', 'drugs', 'profanity', 'educational'] as ThemeTag[], parentNote: 'Subreddit quality varies enormously. NSFW content is one click away. Some educational communities are excellent. Use with strict subreddit allowlisting.', alternatives: ['Quora (moderated Q&A)'] },
  { name: 'Pinterest', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['body-image', 'eating-disorder', 'creativity', 'positive'] as ThemeTag[], parentNote: 'Generally safer than most social platforms. Main risk is body image and diet content. Good for creative inspiration.', alternatives: [] },
  { name: 'BeReal', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['positive'] as ThemeTag[], parentNote: 'Lower risk than most social platforms. No algorithmic feed, no filters, limited features reduce manipulation. Good alternative to Instagram.', alternatives: [] },
  { name: 'Twitch', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['violence', 'profanity', 'gambling', 'predator-risk'] as ThemeTag[], parentNote: 'Live streaming with real-time chat. Chat moderation varies by streamer. Gambling streams and mature content are accessible. Whisper (DM) feature is a risk.', alternatives: ['YouTube Gaming'] },
  { name: 'Omegle / Ome.tv', type: 'app' as ContentType, ageRating: 18, officialRating: '18+', themes: ['predator-risk', 'sexual', 'nudity', 'violence'] as ThemeTag[], parentNote: 'NEVER appropriate for minors. Random video chat with strangers. Extremely high exposure to nudity, sexual content, and predators. Omegle shut down in 2023 but clones persist.', alternatives: ['None — no safe alternative exists for random video chat'] },
  { name: 'Kik', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['predator-risk', 'sextortion', 'sexual'] as ThemeTag[], parentNote: 'Anonymous messaging app with no phone number required. Known predator hunting ground. Strongly not recommended for any minor.', alternatives: ['iMessage', 'WhatsApp (with parental oversight)'] },
  { name: 'Yubo', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['predator-risk', 'sexual', 'body-image'] as ThemeTag[], parentNote: 'Marketed as "Tinder for teens." Live streaming + swiping. Age verification exists but is easily bypassed. High predator risk.', alternatives: ['None — swipe-based social apps are not recommended for minors'] },
];

export function searchPlatforms(query: string): ContentEntry[] {
  const q = query.toLowerCase();
  return PLATFORM_DATABASE.filter(p =>
    p.name.toLowerCase().includes(q) || p.themes.some(t => t.includes(q))
  );
}

export function getAllPlatforms(): ContentEntry[] {
  return PLATFORM_DATABASE;
}

// ── UNIFIED SEARCH ───────────────────────────────────────────

export async function searchAllApis(query: string, type?: ContentType): Promise<ContentEntry[]> {
  const searches: Promise<ContentEntry[]>[] = [];

  if (!type || type === 'movie' || type === 'show') {
    searches.push(searchTmdb(query));
  }
  if (!type || type === 'game') {
    searches.push(searchRawg(query));
  }
  if (!type || type === 'youtube') {
    searches.push(searchYoutube(query));
  }
  // TikTok and apps use AI search
  if (!type || type === 'tiktok' || type === 'app') {
    searches.push(searchViaAI(query, type));
  }
  // Platform search from curated database
  if (type === 'platform') {
    return searchPlatforms(query);
  }

  const results = await Promise.all(searches);
  return results.flat();
}

// ── API KEY CHECK ────────────────────────────────────────────

export function hasApiKeys(): boolean {
  return !!(TMDB_API_KEY || RAWG_API_KEY || YOUTUBE_API_KEY || GEMINI_KEY);
}

export function getApiStatus(): Record<string, boolean> {
  return {
    tmdb: !!TMDB_API_KEY,
    rawg: !!RAWG_API_KEY,
    youtube: !!YOUTUBE_API_KEY,
    gemini: !!GEMINI_KEY,
  };
}
