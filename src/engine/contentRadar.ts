/**
 * Content Radar — rates games, shows, movies, and YouTubers/TikTokers
 * that children engage with. Warns parents about age ratings, themes,
 * and recommends alternatives.
 *
 * Data is on-device (bundled database). No cloud lookups for MVP.
 * In production: API to Common Sense Media, PEGI, ESRB, IMDB.
 */

export type ContentType = 'game' | 'show' | 'movie' | 'youtube' | 'tiktok' | 'app';

export type ThemeTag =
  | 'violence' | 'gore' | 'sexual' | 'nudity' | 'drugs' | 'alcohol'
  | 'gambling' | 'horror' | 'bullying' | 'suicide' | 'eating-disorder'
  | 'consumerism' | 'risk-taking' | 'profanity' | 'body-image'
  | 'radicalization' | 'predator-risk' | 'positive' | 'educational'
  | 'creativity' | 'teamwork' | 'problem-solving' | 'empathy' | 'humor';

export interface ContentEntry {
  name: string;
  type: ContentType;
  ageRating: number; // minimum recommended age
  officialRating: string; // PEGI 12, TV-MA, etc.
  themes: ThemeTag[];
  parentNote: string; // one-line warning or praise
  alternatives: string[]; // safer alternatives with similar appeal
}

// ── BUNDLED DATABASE ─────────────────────────────────────────
// MVP: hardcoded. Production: fetch from API + parent community ratings.

const DATABASE: ContentEntry[] = [
  // GAMES
  {
    name: 'Roblox',
    type: 'game',
    ageRating: 7,
    officialRating: 'PEGI 7',
    themes: ['predator-risk', 'consumerism', 'creativity'],
    parentNote: 'Generally safe but has unmoderated user-created worlds. Chat is the main risk vector — predators target kids here.',
    alternatives: ['Minecraft (with parental controls)', 'LEGO Builder\'s Journey', 'Toca Life World'],
  },
  {
    name: 'Minecraft',
    type: 'game',
    ageRating: 7,
    officialRating: 'PEGI 7',
    themes: ['creativity', 'teamwork', 'problem-solving'],
    parentNote: 'Excellent for creativity. Keep multiplayer servers moderated — public servers can have toxic chat.',
    alternatives: ['LEGO Worlds', 'Terraria', 'Stardew Valley'],
  },
  {
    name: 'Fortnite',
    type: 'game',
    ageRating: 12,
    officialRating: 'PEGI 12',
    themes: ['violence', 'consumerism', 'teamwork'],
    parentNote: 'Cartoon violence, heavy microtransactions. Voice chat with strangers is the main concern.',
    alternatives: ['Splatoon 3', 'Rocket League', 'Fall Guys'],
  },
  {
    name: 'GTA V',
    type: 'game',
    ageRating: 18,
    officialRating: 'PEGI 18',
    themes: ['violence', 'gore', 'sexual', 'drugs', 'profanity'],
    parentNote: '⚠️ NOT for children. Extreme violence, torture scenes, sexual content, drug use. One of the most common games kids play that they shouldn\'t.',
    alternatives: ['Need for Speed Unbound (driving)', 'Watch Dogs 2 (open world, 16+)', 'Spider-Man (open world, 12+)'],
  },
  {
    name: 'Call of Duty',
    type: 'game',
    ageRating: 18,
    officialRating: 'PEGI 18',
    themes: ['violence', 'gore', 'profanity'],
    parentNote: '⚠️ Realistic military violence. Online voice chat is notoriously toxic. Kids are regularly exposed to hate speech.',
    alternatives: ['Splatoon 3 (shooter, kid-friendly)', 'Overwatch 2 (13+)', 'Fortnite (12+)'],
  },
  {
    name: 'Among Us',
    type: 'game',
    ageRating: 9,
    officialRating: 'PEGI 7',
    themes: ['teamwork', 'problem-solving'],
    parentNote: 'Great social deduction game. Public chat can expose kids to inappropriate content — use private lobbies.',
    alternatives: ['Werewolf Online', 'Jackbox Party Packs'],
  },
  {
    name: 'Discord',
    type: 'app',
    ageRating: 13,
    officialRating: '13+',
    themes: ['predator-risk', 'sexual', 'violence', 'bullying'],
    parentNote: '⚠️ High risk. Unmoderated servers expose kids to adult content, predators, and extremist communities. If your child uses it, review their server list.',
    alternatives: ['Apple Messages', 'WhatsApp (family group)', 'Guilded (with parental controls)'],
  },

  // SHOWS
  {
    name: 'Squid Game',
    type: 'show',
    ageRating: 18,
    officialRating: 'TV-MA',
    themes: ['violence', 'gore', 'suicide', 'gambling'],
    parentNote: '⚠️ Extreme violence and psychological horror. Hugely popular with kids despite being rated 18+. Contains graphic death, suicide, and organ harvesting.',
    alternatives: ['Alice in Borderland (16+, similar concept)', 'The Maze Runner (12+)', 'Hunger Games (12+)'],
  },
  {
    name: 'Stranger Things',
    type: 'show',
    ageRating: 14,
    officialRating: 'TV-14',
    themes: ['horror', 'violence', 'teamwork', 'empathy'],
    parentNote: 'Scary but age-appropriate for teens. Strong themes of friendship and courage. Some graphic violence in later seasons.',
    alternatives: ['Gravity Falls (younger kids)', 'Locke & Key (13+)', 'The Owl House'],
  },
  {
    name: 'Cocomelon',
    type: 'show',
    ageRating: 1,
    officialRating: 'TV-Y',
    themes: ['educational', 'positive'],
    parentNote: 'Safe for toddlers. Some research suggests very fast-paced editing may affect attention spans. Mix with slower content.',
    alternatives: ['Bluey', 'Daniel Tiger', 'Hey Bear Sensory'],
  },
  {
    name: 'Bluey',
    type: 'show',
    ageRating: 3,
    officialRating: 'TV-Y',
    themes: ['positive', 'empathy', 'creativity', 'problem-solving'],
    parentNote: '✅ Excellent. Teaches emotional intelligence, resilience, and creative play. One of the best shows for kids.',
    alternatives: ['Puffin Rock', 'Sarah & Duck', 'Hilda'],
  },

  // YOUTUBE / TIKTOK
  {
    name: 'MrBeast',
    type: 'youtube',
    ageRating: 10,
    officialRating: 'N/A',
    themes: ['consumerism', 'risk-taking', 'positive'],
    parentNote: 'Generally positive but extremely materialistic. Normalizes spending huge amounts of money. Good for entertainment, discuss values.',
    alternatives: ['Mark Rober (science)', 'Dude Perfect (sports tricks)', 'SmarterEveryDay (learning)'],
  },
  {
    name: 'Andrew Tate content',
    type: 'tiktok',
    ageRating: 18,
    officialRating: 'N/A',
    themes: ['radicalization', 'body-image', 'violence', 'sexual'],
    parentNote: '⚠️ RED FLAG. Promotes toxic masculinity, misogyny, and violence. Linked to radicalization of teen boys. If your child watches this, have a conversation about respect and healthy relationships.',
    alternatives: ['Yes Theory (positive masculinity)', 'Ali Abdaal (productivity)', 'Doctor Mike (health)'],
  },
  {
    name: 'SSSniperwolf',
    type: 'youtube',
    ageRating: 13,
    officialRating: 'N/A',
    themes: ['body-image', 'consumerism', 'profanity'],
    parentNote: 'React content aimed at young teens. Occasional inappropriate language and themes. Very popular with 10-14 year olds.',
    alternatives: ['Jenna Ezarik', 'Simone Giertz (engineering)', 'Rosanna Pansino (baking)'],
  },
  {
    name: 'Skibidi Toilet',
    type: 'youtube',
    ageRating: 7,
    officialRating: 'N/A',
    themes: ['violence'],
    parentNote: 'Surreal animated series hugely popular with kids 6-10. Mild cartoon violence. Not harmful but low educational value. A cultural phenomenon — banning it may backfire.',
    alternatives: ['LEGO animations', 'Kurzgesagt (science)', 'Odd1sOut'],
  },
  {
    name: 'IShowSpeed',
    type: 'youtube',
    ageRating: 16,
    officialRating: 'N/A',
    themes: ['profanity', 'risk-taking', 'violence'],
    parentNote: '⚠️ Extremely popular with teen boys. Known for rage content, dangerous stunts, and frequent profanity. Normalizes aggression and reckless behavior.',
    alternatives: ['Dude Perfect', 'Mark Rober', 'KSI (milder content)'],
  },
  {
    name: 'Nikocado Avocado',
    type: 'youtube',
    ageRating: 16,
    officialRating: 'N/A',
    themes: ['eating-disorder', 'body-image'],
    parentNote: '⚠️ Extreme mukbang (binge eating) content. Can normalize disordered eating. Often involves emotional breakdowns. Not suitable for children developing their relationship with food.',
    alternatives: ['Joshua Weissman (cooking)', 'Babish (cooking)', 'Emmy Made (food exploration)'],
  },
  {
    name: 'Aphmau',
    type: 'youtube',
    ageRating: 7,
    officialRating: 'N/A',
    themes: ['creativity', 'positive', 'teamwork'],
    parentNote: '✅ Minecraft roleplay content. Generally safe and positive. Very popular with younger kids (7-12).',
    alternatives: ['Stampy', 'DanTDM (when family-friendly)', 'LDShadowLady'],
  },
  {
    name: 'PewDiePie',
    type: 'youtube',
    ageRating: 14,
    officialRating: 'N/A',
    themes: ['profanity', 'humor'],
    parentNote: 'Gaming and meme commentary. Occasional mature humor and language. Generally safe for teens but not younger kids.',
    alternatives: ['Jacksepticeye', 'Markiplier', 'Game Theory'],
  },
  {
    name: 'Cocomelon (YouTube)',
    type: 'youtube',
    ageRating: 1,
    officialRating: 'N/A',
    themes: ['educational', 'positive'],
    parentNote: 'Same as the TV show. Safe but very fast-paced editing. Balance with slower content like Hey Bear or Bluey.',
    alternatives: ['Hey Bear Sensory', 'Little Baby Bum', 'Super Simple Songs'],
  },
  {
    name: 'Pro-ana / Thinspo accounts',
    type: 'tiktok',
    ageRating: 18,
    officialRating: 'N/A',
    themes: ['eating-disorder', 'body-image', 'suicide'],
    parentNote: '⚠️ DANGEROUS. Pro-anorexia and "thinspiration" content directly causes eating disorders. If your child follows these accounts, seek professional help.',
    alternatives: ['Body-positive accounts', 'Natacha Oceane (healthy fitness)', 'Yoga With Adriene'],
  },
];

// ── LOOKUP FUNCTIONS ─────────────────────────────────────────

export function lookupContent(query: string): ContentEntry | null {
  const q = query.toLowerCase().trim();
  return DATABASE.find((entry) =>
    entry.name.toLowerCase().includes(q) || q.includes(entry.name.toLowerCase())
  ) || null;
}

export function checkAgeAppropriate(content: ContentEntry, childAge: number): {
  appropriate: boolean;
  warning: string | null;
} {
  if (childAge >= content.ageRating) {
    return { appropriate: true, warning: null };
  }
  const gap = content.ageRating - childAge;
  return {
    appropriate: false,
    warning: `${content.name} is rated ${content.officialRating} (age ${content.ageRating}+). Your child is ${gap} year(s) under the recommended age.`,
  };
}

export function getThemeWarnings(content: ContentEntry): string[] {
  const warnings: string[] = [];
  const dangerousThemes: ThemeTag[] = ['violence', 'gore', 'sexual', 'nudity', 'drugs', 'suicide', 'eating-disorder', 'radicalization', 'predator-risk'];

  for (const theme of content.themes) {
    if (dangerousThemes.includes(theme)) {
      warnings.push(theme.replace('-', ' '));
    }
  }
  return warnings;
}

export function getAlternatives(content: ContentEntry): string[] {
  return content.alternatives;
}

export function getAllContent(): ContentEntry[] {
  return DATABASE;
}

export function getContentByType(type: ContentType): ContentEntry[] {
  return DATABASE.filter((e) => e.type === type);
}

export function searchContent(query: string): ContentEntry[] {
  const q = query.toLowerCase();
  return DATABASE.filter((e) => e.name.toLowerCase().includes(q));
}
