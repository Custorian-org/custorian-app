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
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const RAWG_API_KEY = process.env.RAWG_API_KEY || '';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

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

  const results = await Promise.all(searches);
  return results.flat();
}

// ── API KEY CHECK ────────────────────────────────────────────

export function hasApiKeys(): boolean {
  return !!(TMDB_API_KEY || RAWG_API_KEY || YOUTUBE_API_KEY);
}

export function getApiStatus(): Record<string, boolean> {
  return {
    tmdb: !!TMDB_API_KEY,
    rawg: !!RAWG_API_KEY,
    youtube: !!YOUTUBE_API_KEY,
  };
}
