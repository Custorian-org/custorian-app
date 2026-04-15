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

// Platform subcategories for organized display
export type PlatformCategory = 'social' | 'messaging' | 'video' | 'gaming' | 'dating' | 'anonymous' | 'news';

export interface PlatformEntry extends ContentEntry {
  platformCategory: PlatformCategory;
}

export const PLATFORM_DATABASE: PlatformEntry[] = [
  // ── SOCIAL MEDIA ──
  { platformCategory: 'social', name: 'Instagram', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['body-image', 'bullying', 'predator-risk', 'sexual', 'creativity'] as ThemeTag[], parentNote: 'DMs are the primary risk vector. Algorithm amplifies appearance-focused content. Teen accounts have some protections but are easily bypassed.', alternatives: ['BeReal', 'VSCO'] },
  { platformCategory: 'social', name: 'TikTok', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['body-image', 'eating-disorder', 'dangerous-challenges', 'predator-risk', 'creativity'] as ThemeTag[], parentNote: 'Algorithm can surface self-harm and eating disorder content to teens within 30 minutes. Restricted Mode helps but is imperfect.', alternatives: ['YouTube Kids'] },
  { platformCategory: 'social', name: 'Snapchat', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['predator-risk', 'sexual', 'body-image', 'dangerous-challenges'] as ThemeTag[], parentNote: 'Disappearing messages make oversight difficult. My AI chatbot has engaged inappropriately with minors. Snap Map location sharing is a significant risk.', alternatives: ['iMessage'] },
  { platformCategory: 'social', name: 'Facebook', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['predator-risk', 'hate-speech', 'misogyny'] as ThemeTag[], parentNote: 'Less popular with teens but Marketplace and Groups remain risk areas. Messenger Kids is the age-appropriate alternative.', alternatives: ['Messenger Kids'] },
  { platformCategory: 'social', name: 'X (Twitter)', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['hate-speech', 'sexual', 'violence', 'profanity'] as ThemeTag[], parentNote: 'Adult content allowed since 2024. Moderation significantly reduced. Not recommended for children under 16.', alternatives: ['Bluesky'] },
  { platformCategory: 'social', name: 'Truth Social', type: 'app' as ContentType, ageRating: 17, officialRating: '17+', themes: ['hate-speech', 'radicalization', 'violence', 'profanity'] as ThemeTag[], parentNote: 'Minimal content moderation. Political extremism and conspiracy content prevalent. Not appropriate for minors.', alternatives: [] },
  { platformCategory: 'social', name: 'Reddit', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['sexual', 'violence', 'drugs', 'profanity', 'educational'] as ThemeTag[], parentNote: 'NSFW content one click away. Some educational communities are excellent. Use with strict subreddit allowlisting only.', alternatives: ['Quora'] },
  { platformCategory: 'social', name: 'Pinterest', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['body-image', 'eating-disorder', 'creativity', 'positive'] as ThemeTag[], parentNote: 'Generally safer. Main risk is body image and diet content. Good for creative inspiration.', alternatives: [] },
  { platformCategory: 'social', name: 'BeReal', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['positive'] as ThemeTag[], parentNote: 'Lower risk than most. No algorithmic feed, no filters. Good alternative to Instagram.', alternatives: [] },
  { platformCategory: 'social', name: 'Threads', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['profanity', 'positive'] as ThemeTag[], parentNote: 'Meta\'s text platform. Moderate moderation. Less risky than X but still has public exposure. Linked to Instagram account.', alternatives: ['Bluesky'] },
  { platformCategory: 'social', name: 'Bluesky', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['positive', 'profanity'] as ThemeTag[], parentNote: 'Better moderation than X. User-controlled content filtering. Relatively safer but still public social media.', alternatives: [] },
  { platformCategory: 'social', name: 'Tumblr', type: 'app' as ContentType, ageRating: 17, officialRating: '17+', themes: ['sexual', 'self-harm-promotion', 'body-image', 'creativity'] as ThemeTag[], parentNote: 'History of self-harm and eating disorder communities. Some creative communities are positive. Content filtering is inconsistent.', alternatives: [] },
  { platformCategory: 'social', name: 'Lemon8', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['body-image', 'consumerism', 'creativity'] as ThemeTag[], parentNote: 'TikTok sister app focused on lifestyle content. Body image and beauty standard pressure. Less risky than TikTok but similar algorithm concerns.', alternatives: ['Pinterest'] },

  // ── MESSAGING ──
  { platformCategory: 'messaging', name: 'WhatsApp', type: 'app' as ContentType, ageRating: 16, officialRating: '16+', themes: ['predator-risk', 'sextortion'] as ThemeTag[], parentNote: 'E2E encryption means no content moderation. #1 platform predators migrate to after initial contact. Group chats with strangers are high-risk.', alternatives: ['iMessage'] },
  { platformCategory: 'messaging', name: 'Discord', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['predator-risk', 'violence', 'sexual', 'profanity', 'teamwork'] as ThemeTag[], parentNote: 'Used by 65% of teens. Public servers have minimal moderation. Voice channels are unmonitored. High predator risk in public servers.', alternatives: ['Guilded'] },
  { platformCategory: 'messaging', name: 'Telegram', type: 'app' as ContentType, ageRating: 16, officialRating: '16+', themes: ['predator-risk', 'sexual', 'radicalization', 'drugs'] as ThemeTag[], parentNote: 'Minimal moderation. Secret chats are encrypted. Widely used for illegal content including CSAM. Not recommended for minors.', alternatives: ['Signal'] },
  { platformCategory: 'messaging', name: 'Signal', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: [] as ThemeTag[], parentNote: 'Privacy-focused messaging. No content moderation due to encryption. Safer than Telegram/WhatsApp because less discovery of strangers, but still E2E encrypted.', alternatives: ['iMessage'] },
  { platformCategory: 'messaging', name: 'Messenger / Messenger Kids', type: 'app' as ContentType, ageRating: 6, officialRating: '6+ (Kids) / 13+ (Regular)', themes: ['predator-risk', 'positive'] as ThemeTag[], parentNote: 'Messenger Kids (ages 6-12) has parental controls and no ads. Regular Messenger has same risks as any messaging platform. Use Kids version for under-13s.', alternatives: ['Messenger Kids'] },
  { platformCategory: 'messaging', name: 'Kik', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['predator-risk', 'sextortion', 'sexual'] as ThemeTag[], parentNote: 'Anonymous messaging, no phone number required. Known predator hunting ground. Strongly not recommended for any minor.', alternatives: ['iMessage'] },
  { platformCategory: 'messaging', name: 'iMessage', type: 'app' as ContentType, ageRating: 6, officialRating: '4+', themes: ['positive'] as ThemeTag[], parentNote: 'Safest major messaging platform for children. Built into Apple devices. Use Screen Time to manage contacts. Communication Safety feature detects nudity.', alternatives: [] },

  // ── VIDEO ──
  { platformCategory: 'video', name: 'YouTube', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['violence', 'profanity', 'educational', 'creativity'] as ThemeTag[], parentNote: 'Enormous content range. Autoplay and recommendations can lead to inappropriate content. Use Restricted Mode. YouTube Kids is better for under-13s.', alternatives: ['YouTube Kids'] },
  { platformCategory: 'video', name: 'YouTube Kids', type: 'app' as ContentType, ageRating: 4, officialRating: '4+', themes: ['educational', 'creativity', 'positive'] as ThemeTag[], parentNote: 'Curated for children. Still shows ads. Occasional inappropriate content slips through (~1 in 5 videos flagged by researchers). Timer and content controls available.', alternatives: [] },
  { platformCategory: 'video', name: 'Twitch', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['violence', 'profanity', 'gambling', 'predator-risk'] as ThemeTag[], parentNote: 'Live streaming with real-time chat. Moderation varies by streamer. Gambling streams and mature content accessible. Whisper DMs are a risk.', alternatives: ['YouTube Gaming'] },
  { platformCategory: 'video', name: 'Netflix', type: 'app' as ContentType, ageRating: 6, officialRating: '7+', themes: ['violence', 'sexual', 'educational', 'positive'] as ThemeTag[], parentNote: 'Set up a Kids profile with age-appropriate content. PIN-protect the adult profiles. Some teen content deals with heavy themes (13 Reasons Why, etc.).', alternatives: ['Disney+'] },
  { platformCategory: 'video', name: 'Disney+', type: 'app' as ContentType, ageRating: 6, officialRating: '7+', themes: ['positive', 'educational', 'creativity'] as ThemeTag[], parentNote: 'Generally safest streaming platform for children. Kids profile available. Some Marvel/Star Wars content has moderate violence.', alternatives: [] },

  // ── GAMING ──
  { platformCategory: 'gaming', name: 'Roblox', type: 'app' as ContentType, ageRating: 7, officialRating: 'PEGI 7', themes: ['predator-risk', 'consumerism', 'creativity'] as ThemeTag[], parentNote: '67M daily active users, over half under 13. Unmoderated user-created worlds. Chat is the main risk — predators target kids here. Enable all parental controls.', alternatives: ['Minecraft'] },
  { platformCategory: 'gaming', name: 'Fortnite', type: 'app' as ContentType, ageRating: 12, officialRating: 'PEGI 12', themes: ['violence', 'consumerism', 'teamwork'] as ThemeTag[], parentNote: 'Battle royale shooter. 45% of players are under 10 despite PEGI 12 rating. Voice chat with strangers is the main risk. Disable voice chat for younger players.', alternatives: ['Splatoon'] },
  { platformCategory: 'gaming', name: 'Minecraft', type: 'app' as ContentType, ageRating: 7, officialRating: 'PEGI 7', themes: ['creativity', 'teamwork', 'problem-solving'] as ThemeTag[], parentNote: 'Excellent for creativity. Keep multiplayer servers moderated — public servers can have toxic chat.', alternatives: ['LEGO Worlds'] },
  { platformCategory: 'gaming', name: 'Among Us', type: 'app' as ContentType, ageRating: 10, officialRating: 'PEGI 7', themes: ['teamwork', 'humor'] as ThemeTag[], parentNote: 'Generally safe. Chat can be inappropriate on public servers. Use private games with known friends only.', alternatives: [] },
  { platformCategory: 'gaming', name: 'Brawl Stars', type: 'app' as ContentType, ageRating: 9, officialRating: 'PEGI 9', themes: ['violence', 'consumerism', 'teamwork'] as ThemeTag[], parentNote: 'Cartoon violence. Heavy in-app purchases pressure. Chat feature exists but limited. Relatively safer than most multiplayer games.', alternatives: [] },
  { platformCategory: 'gaming', name: 'Call of Duty Mobile', type: 'app' as ContentType, ageRating: 17, officialRating: 'PEGI 18', themes: ['violence', 'gore', 'profanity'] as ThemeTag[], parentNote: 'Realistic military violence. Voice chat with strangers. Not appropriate for minors under 16.', alternatives: ['Splatoon', 'Fortnite'] },
  { platformCategory: 'gaming', name: 'GTA V / GTA Online', type: 'app' as ContentType, ageRating: 18, officialRating: 'PEGI 18', themes: ['violence', 'gore', 'sexual', 'drugs', 'profanity'] as ThemeTag[], parentNote: 'Extreme violence, sexual content, drug use. NEVER appropriate for minors. One of the most common games found on kids\' devices despite 18+ rating.', alternatives: [] },
  { platformCategory: 'gaming', name: 'Valorant', type: 'app' as ContentType, ageRating: 16, officialRating: 'PEGI 16', themes: ['violence', 'teamwork', 'profanity'] as ThemeTag[], parentNote: 'Tactical shooter. Voice comms can be toxic. Better moderation than most FPS games but still violent.', alternatives: ['Splatoon'] },
  { platformCategory: 'gaming', name: 'Apex Legends', type: 'app' as ContentType, ageRating: 16, officialRating: 'PEGI 16', themes: ['violence', 'teamwork'] as ThemeTag[], parentNote: 'Battle royale with less graphic violence than CoD. Voice chat with strangers. Moderate risk.', alternatives: ['Fortnite'] },
  { platformCategory: 'gaming', name: 'League of Legends', type: 'app' as ContentType, ageRating: 12, officialRating: 'PEGI 12', themes: ['violence', 'bullying', 'teamwork'] as ThemeTag[], parentNote: 'Notoriously toxic player community. Chat abuse is common. Good game but social environment is harsh for children.', alternatives: [] },

  // ── DATING / HIGH RISK ──
  { platformCategory: 'dating', name: 'Yubo', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['predator-risk', 'sexual', 'body-image'] as ThemeTag[], parentNote: '"Tinder for teens." Swiping + live streaming. Age verification easily bypassed. Very high predator risk.', alternatives: ['None recommended'] },
  { platformCategory: 'dating', name: 'Wizz', type: 'app' as ContentType, ageRating: 17, officialRating: '17+', themes: ['predator-risk', 'sexual', 'sextortion'] as ThemeTag[], parentNote: 'Random matching app popular with teens. Removed from App Store multiple times for child safety issues. If reinstalled, remove immediately.', alternatives: ['None recommended'] },
  { platformCategory: 'dating', name: 'Tinder', type: 'app' as ContentType, ageRating: 18, officialRating: '18+', themes: ['sexual', 'predator-risk'] as ThemeTag[], parentNote: 'Adult dating app. If found on a minor\'s device, have an immediate conversation. Age verification exists but is imperfect.', alternatives: ['None — dating apps not for minors'] },

  // ── ANONYMOUS / RANDOM ──
  { platformCategory: 'anonymous', name: 'Omegle / Ome.tv', type: 'app' as ContentType, ageRating: 18, officialRating: '18+', themes: ['predator-risk', 'sexual', 'nudity', 'violence'] as ThemeTag[], parentNote: 'NEVER appropriate for minors. Random video chat with strangers. Extreme exposure to nudity and predators. Omegle shut down but clones persist.', alternatives: ['None'] },
  { platformCategory: 'anonymous', name: 'Yik Yak', type: 'app' as ContentType, ageRating: 17, officialRating: '17+', themes: ['bullying', 'hate-speech', 'profanity'] as ThemeTag[], parentNote: 'Anonymous location-based posting. Has been linked to school bullying incidents and threats. Not recommended for any minor.', alternatives: [] },
  { platformCategory: 'anonymous', name: 'Whisper', type: 'app' as ContentType, ageRating: 17, officialRating: '17+', themes: ['predator-risk', 'sexual', 'drugs'] as ThemeTag[], parentNote: 'Anonymous posting and messaging. Predators use it to target minors. Not recommended.', alternatives: [] },
  { platformCategory: 'anonymous', name: 'Ask.fm', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['bullying', 'self-harm-promotion', 'predator-risk'] as ThemeTag[], parentNote: 'Anonymous Q&A platform linked to multiple teen suicides from cyberbullying. Despite reforms, anonymous questions remain a vector for abuse.', alternatives: [] },
  { platformCategory: 'anonymous', name: 'NGL', type: 'app' as ContentType, ageRating: 17, officialRating: '17+', themes: ['bullying', 'predator-risk'] as ThemeTag[], parentNote: '"Anonymous messages" app popular with teens on Instagram. Linked to cyberbullying. Most "anonymous" messages are actually generated by the app to drive engagement.', alternatives: [] },

  // ── NEWS / OTHER ──
  { platformCategory: 'news', name: 'Quora', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['educational', 'positive'] as ThemeTag[], parentNote: 'Q&A platform. Generally educational. Some mature topics but moderation is reasonable. Good alternative to Reddit for research.', alternatives: [] },
  { platformCategory: 'news', name: 'Substack', type: 'app' as ContentType, ageRating: 13, officialRating: '13+', themes: ['educational'] as ThemeTag[], parentNote: 'Newsletter platform. Content quality depends entirely on which writers the user follows. Generally low risk.', alternatives: [] },
];

export const PLATFORM_CATEGORIES: { key: PlatformCategory; label: string; icon: string }[] = [
  { key: 'social', label: 'Social Media', icon: '📱' },
  { key: 'messaging', label: 'Messaging', icon: '💬' },
  { key: 'video', label: 'Video & Streaming', icon: '📺' },
  { key: 'gaming', label: 'Gaming', icon: '🎮' },
  { key: 'dating', label: 'Dating / High Risk', icon: '⚠️' },
  { key: 'anonymous', label: 'Anonymous', icon: '👻' },
  { key: 'news', label: 'News & Other', icon: '📰' },
];

export function getPlatformsByCategory(category?: PlatformCategory): PlatformEntry[] {
  if (!category) return PLATFORM_DATABASE;
  return PLATFORM_DATABASE.filter(p => p.platformCategory === category);
}

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
