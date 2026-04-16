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
  | 'violence' | 'gore' | 'sexual' | 'nudity' | 'drugs'
  | 'gambling' | 'horror' | 'bullying' | 'suicide' | 'eating-disorder'
  | 'consumerism' | 'risk-taking' | 'profanity' | 'body-image'
  | 'radicalization' | 'predator-risk' | 'positive' | 'educational'
  | 'creativity' | 'teamwork' | 'problem-solving' | 'empathy' | 'humor'
  | 'misogyny' | 'toxic-masculinity' | 'self-harm-promotion' | 'dangerous-challenges'
  | 'hate-speech' | 'scam' | 'weaponry'
  | 'stalking' | 'doxxing' | 'revenge-porn' | 'sextortion';

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

  // ── INFLUENCERS & CREATORS (expanded) ─────────────────────────

  // RED FLAG CREATORS
  {
    name: 'Sneako',
    type: 'youtube',
    ageRating: 18,
    officialRating: 'N/A',
    themes: ['radicalization', 'misogyny', 'toxic-masculinity', 'hate-speech'],
    parentNote: '⚠️ RED FLAG. Manosphere content promoting misogyny and red-pill ideology. Closely associated with Andrew Tate. Targets teen boys.',
    alternatives: ['Yes Theory', 'Ali Abdaal', 'Matt D\'Avella'],
  },
  {
    name: 'Fresh and Fit',
    type: 'youtube',
    ageRating: 18,
    officialRating: 'N/A',
    themes: ['misogyny', 'toxic-masculinity', 'sexual', 'radicalization'],
    parentNote: '⚠️ RED FLAG. Podcast promoting toxic views on women and relationships. Targets young men. Content normalises manipulation and objectification.',
    alternatives: ['HealthyGamerGG (mental health)', 'School of Life', 'TED Talks'],
  },
  {
    name: 'Nick Fuentes content',
    type: 'youtube',
    ageRating: 18,
    officialRating: 'N/A',
    themes: ['radicalization', 'hate-speech'],
    parentNote: '⚠️ RED FLAG. White nationalist and antisemitic content. Banned from most platforms but clips circulate. Immediate intervention needed if child is consuming this.',
    alternatives: ['Kurzgesagt (geopolitics)', 'Johnny Harris (current events)', 'Crash Course'],
  },

  // DANGEROUS CHALLENGES / SELF-HARM
  {
    name: 'Blackout challenge content',
    type: 'tiktok',
    ageRating: 18,
    officialRating: 'N/A',
    themes: ['dangerous-challenges', 'self-harm-promotion', 'violence'],
    parentNote: '⚠️ LETHAL. The "blackout challenge" has killed multiple children. If your child mentions this, have an immediate conversation. Contact crisis services if needed.',
    alternatives: [],
  },
  {
    name: 'Self-harm TikTok (coded)',
    type: 'tiktok',
    ageRating: 18,
    officialRating: 'N/A',
    themes: ['self-harm-promotion', 'suicide', 'eating-disorder'],
    parentNote: '⚠️ DANGEROUS. Self-harm content on TikTok uses coded language and hashtags to evade moderation (#sh, #selfharmaware, #grippy socks). If your child follows these, seek professional help.',
    alternatives: ['Kati Morton (licensed therapist)', 'Dr Julie Smith (mental health)'],
  },

  {
    name: 'Adin Ross',
    type: 'youtube',
    ageRating: 18,
    officialRating: 'N/A',
    themes: ['gambling', 'profanity', 'sexual', 'hate-speech', 'radicalization'],
    parentNote: '⚠️ RED FLAG. Gambling streams, racist incidents, hosted extremists (Nick Fuentes, Andrew Tate). Extremely popular with teen boys.',
    alternatives: ['Dude Perfect', 'MrBeast', 'Mark Rober'],
  },

  // BULLYING-ADJACENT CONTENT
  {
    name: 'Drama channels (Keemstar, etc)',
    type: 'youtube',
    ageRating: 16,
    officialRating: 'N/A',
    themes: ['bullying', 'profanity', 'hate-speech'],
    parentNote: '⚠️ Drama and call-out culture normalises public shaming and harassment. Teaches kids that bullying is entertainment. Includes DramaAlert, Def Noodles, etc.',
    alternatives: ['Philip DeFranco (news, more balanced)', 'Hasan Piker (commentary)'],
  },
  {
    name: 'Prank channels',
    type: 'youtube',
    ageRating: 14,
    officialRating: 'N/A',
    themes: ['bullying', 'risk-taking', 'violence'],
    parentNote: 'Pranks often involve humiliation, property damage, or physical harm disguised as humor. Teaches kids that hurting people is funny. Includes N&A Productions, Vitaly, etc.',
    alternatives: ['Dude Perfect (stunts without cruelty)', 'Zach King (magic edits)'],
  },

  // VIOLENT CONTENT
  {
    name: 'Gore/shock accounts',
    type: 'tiktok',
    ageRating: 18,
    officialRating: 'N/A',
    themes: ['gore', 'violence', 'self-harm-promotion'],
    parentNote: '⚠️ DANGEROUS. Real violence, accident footage, and gore circulates on TikTok and X/Twitter despite moderation. Causes trauma, desensitisation, and PTSD symptoms in children.',
    alternatives: [],
  },

  // BODY IMAGE
  {
    name: 'Fitfluencers (teens)',
    type: 'tiktok',
    ageRating: 16,
    officialRating: 'N/A',
    themes: ['body-image', 'eating-disorder'],
    parentNote: 'Fitness influencers promoting extreme diets, body checking, and transformation content. Can trigger body dysmorphia and eating disorders in teens, especially girls ages 12-16.',
    alternatives: ['Natacha Oceane (balanced)', 'Yoga With Adriene', 'Body Positive Panda'],
  },
  {
    name: 'Ozempic/weight loss TikTok',
    type: 'tiktok',
    ageRating: 18,
    officialRating: 'N/A',
    themes: ['body-image', 'eating-disorder', 'drugs'],
    parentNote: '⚠️ Children seeing Ozempic and weight loss drug content normalises pharmaceutical solutions to body image. Combined with "what I eat in a day" content, this drives disordered eating.',
    alternatives: ['Dr Julie Smith (mental health)', 'Abbey Sharp RD (nutrition science)'],
  },

  // POSITIVE CREATORS (so parents know what to recommend)
  {
    name: 'Mark Rober',
    type: 'youtube',
    ageRating: 7,
    officialRating: 'N/A',
    themes: ['educational', 'creativity', 'problem-solving', 'positive'],
    parentNote: '✅ Excellent. Former NASA engineer. Science experiments, engineering challenges, and curiosity-driven content. One of the best channels for kids.',
    alternatives: ['SmarterEveryDay', 'Kurzgesagt', 'Veritasium'],
  },
  {
    name: 'Kurzgesagt',
    type: 'youtube',
    ageRating: 10,
    officialRating: 'N/A',
    themes: ['educational', 'positive', 'problem-solving'],
    parentNote: '✅ Beautiful animated science explainers. Some topics (nuclear war, pandemics) may be intense for young children. Great for ages 10+.',
    alternatives: ['Mark Rober', 'TED-Ed', 'MinutePhysics'],
  },
  {
    name: 'HealthyGamerGG',
    type: 'youtube',
    ageRating: 14,
    officialRating: 'N/A',
    themes: ['positive', 'empathy', 'educational'],
    parentNote: '✅ Dr. K (Harvard psychiatrist) discusses mental health, gaming addiction, and relationships. Excellent for teens struggling with online life.',
    alternatives: ['Kati Morton', 'Dr Julie Smith', 'Therapy in a Nutshell'],
  },
  {
    name: 'Crash Course',
    type: 'youtube',
    ageRating: 10,
    officialRating: 'N/A',
    themes: ['educational', 'positive'],
    parentNote: '✅ High-quality educational content across science, history, literature, and more. Hank and John Green. Perfect for school-age kids.',
    alternatives: ['TED-Ed', 'Kurzgesagt', 'Oversimplified'],
  },

  // ── MORE GAMES ──
  { name: 'Splatoon 3', type: 'game', ageRating: 7, officialRating: 'PEGI 7', themes: ['teamwork', 'creativity', 'positive'], parentNote: '✅ Excellent non-violent shooter alternative. Ink instead of blood. Great for kids who want competitive gameplay.', alternatives: [] },
  { name: 'Mario Kart 8', type: 'game', ageRating: 3, officialRating: 'PEGI 3', themes: ['positive', 'teamwork'], parentNote: '✅ Safe for all ages. Great family game. Online play has limited chat.', alternatives: [] },
  { name: 'Animal Crossing', type: 'game', ageRating: 3, officialRating: 'PEGI 3', themes: ['creativity', 'positive', 'teamwork'], parentNote: '✅ Calm, creative gameplay. Online visitors can leave messages — monitor younger kids.', alternatives: [] },
  { name: 'FIFA / EA Sports FC', type: 'game', ageRating: 3, officialRating: 'PEGI 3', themes: ['consumerism', 'teamwork'], parentNote: 'Safe gameplay but Ultimate Team mode has loot box mechanics. Spending real money on packs is a risk.', alternatives: ['Rocket League'] },
  { name: 'Rocket League', type: 'game', ageRating: 3, officialRating: 'PEGI 3', themes: ['teamwork', 'positive'], parentNote: '✅ Car football. Quick chat only (preset phrases). Very safe for online play.', alternatives: [] },
  { name: 'Fall Guys', type: 'game', ageRating: 3, officialRating: 'PEGI 3', themes: ['humor', 'positive', 'teamwork'], parentNote: '✅ Fun party game. No chat, no violence. Safe for all ages.', alternatives: [] },
  { name: 'Stumble Guys', type: 'game', ageRating: 7, officialRating: 'PEGI 7', themes: ['humor', 'consumerism'], parentNote: 'Fall Guys clone with more aggressive monetization. Ads between rounds.', alternatives: ['Fall Guys'] },
  { name: 'Clash Royale', type: 'game', ageRating: 10, officialRating: 'PEGI 7', themes: ['violence', 'consumerism', 'teamwork'], parentNote: 'Cartoon violence. Clan chat can have inappropriate content. Heavy in-app purchase pressure.', alternatives: [] },
  { name: 'Genshin Impact', type: 'game', ageRating: 12, officialRating: 'PEGI 12', themes: ['violence', 'gambling', 'consumerism'], parentNote: 'Beautiful game but has gacha mechanics (gambling-like character pulls). Very addictive spending model.', alternatives: [] },
  { name: 'Stardew Valley', type: 'game', ageRating: 7, officialRating: 'PEGI 7', themes: ['creativity', 'positive', 'problem-solving'], parentNote: '✅ Peaceful farming game. Mild romance subplot. Excellent for creativity and relaxation.', alternatives: [] },
  { name: 'Terraria', type: 'game', ageRating: 10, officialRating: 'PEGI 12', themes: ['violence', 'creativity', 'teamwork'], parentNote: 'Like Minecraft with more combat. Moderate cartoon violence. Good creativity.', alternatives: ['Minecraft'] },
  { name: 'PUBG Mobile', type: 'game', ageRating: 16, officialRating: 'PEGI 16', themes: ['violence', 'profanity'], parentNote: 'Battle royale with realistic weapons. Voice chat with strangers. Not for under 14.', alternatives: ['Fortnite', 'Splatoon'] },
  { name: 'Candy Crush', type: 'game', ageRating: 5, officialRating: 'PEGI 3', themes: ['consumerism'], parentNote: 'Safe content but designed to be addictive. In-app purchases pressure. Set spending limits.', alternatives: [] },
  { name: 'Toca Life World', type: 'game', ageRating: 5, officialRating: 'PEGI 3', themes: ['creativity', 'positive', 'educational'], parentNote: '✅ Excellent creative play app for young children. No ads, no chat, no risks.', alternatives: [] },
  { name: 'LEGO Worlds', type: 'game', ageRating: 7, officialRating: 'PEGI 7', themes: ['creativity', 'positive'], parentNote: '✅ Building game like Minecraft but LEGO-themed. Safe for all ages.', alternatives: ['Minecraft'] },
  { name: 'Overwatch 2', type: 'game', ageRating: 13, officialRating: 'PEGI 12', themes: ['violence', 'teamwork'], parentNote: 'Team shooter with cartoon violence. Voice chat can be toxic. Disable voice chat for younger teens.', alternatives: ['Splatoon'] },

  // ── MORE SHOWS ──
  { name: 'Bluey', type: 'show', ageRating: 3, officialRating: 'TV-G', themes: ['positive', 'educational', 'empathy'], parentNote: '✅ Outstanding children\'s show about family, emotions, and play. Loved by kids AND parents.', alternatives: [] },
  { name: 'Stranger Things', type: 'show', ageRating: 14, officialRating: 'TV-14', themes: ['violence', 'horror', 'teamwork'], parentNote: 'Intense horror/sci-fi. Violence, jump scares, frightening imagery. Not for under 12.', alternatives: [] },
  { name: 'Wednesday', type: 'show', ageRating: 14, officialRating: 'TV-14', themes: ['violence', 'horror', 'humor'], parentNote: 'Dark humor, moderate violence, horror themes. Popular with teens. Gothic themes.', alternatives: [] },
  { name: 'Squid Game', type: 'show', ageRating: 17, officialRating: 'TV-MA', themes: ['violence', 'gore', 'horror'], parentNote: '⚠️ EXTREME violence. Children dying in graphic detail. Absolutely not for minors despite its popularity with them.', alternatives: [] },
  { name: 'Cocomelon', type: 'show', ageRating: 2, officialRating: 'TV-Y', themes: ['educational', 'positive'], parentNote: '✅ Safe for toddlers. Some parents report it\'s overstimulating due to rapid scene changes. Limit session length.', alternatives: ['Bluey', 'Peppa Pig'] },
  { name: 'Peppa Pig', type: 'show', ageRating: 2, officialRating: 'TV-Y', themes: ['positive', 'humor', 'educational'], parentNote: '✅ Gentle, safe show for young children. Mild cheeky humor.', alternatives: ['Bluey'] },
  { name: 'Paw Patrol', type: 'show', ageRating: 3, officialRating: 'TV-Y', themes: ['positive', 'teamwork'], parentNote: '✅ Safe action show for young kids. Prosocial messages about helping others.', alternatives: [] },
  { name: 'Gravity Falls', type: 'show', ageRating: 7, officialRating: 'TV-Y7', themes: ['humor', 'creativity', 'positive'], parentNote: '✅ Clever, witty animated show. Mystery themes. Great for 7+ kids.', alternatives: ['The Owl House'] },
  { name: 'The Owl House', type: 'show', ageRating: 7, officialRating: 'TV-Y7', themes: ['creativity', 'positive', 'empathy'], parentNote: '✅ Great animated show with diverse representation. Some scary moments for very young kids.', alternatives: ['Gravity Falls'] },
  { name: 'Euphoria', type: 'show', ageRating: 18, officialRating: 'TV-MA', themes: ['sexual', 'drugs', 'violence', 'nudity'], parentNote: '⚠️ NOT for minors. Explicit drug use, sex, nudity, self-harm. Despite teen characters, this is adult content.', alternatives: [] },
  { name: '13 Reasons Why', type: 'show', ageRating: 17, officialRating: 'TV-MA', themes: ['suicide', 'sexual', 'bullying', 'violence'], parentNote: '⚠️ Contains graphic suicide scene and sexual assault. Linked to increased suicide searches. If your teen has seen it, talk to them.', alternatives: [] },
  { name: 'Avatar: The Last Airbender', type: 'show', ageRating: 7, officialRating: 'TV-Y7', themes: ['positive', 'teamwork', 'empathy', 'creativity'], parentNote: '✅ One of the best animated shows ever made. Themes of responsibility, friendship, and growth.', alternatives: [] },
  { name: 'SpongeBob SquarePants', type: 'show', ageRating: 6, officialRating: 'TV-Y7', themes: ['humor', 'positive'], parentNote: '✅ Classic safe cartoon. Slapstick humor. Some episodes have mild crude humor.', alternatives: [] },
  { name: 'The Amazing World of Gumball', type: 'show', ageRating: 7, officialRating: 'TV-Y7', themes: ['humor', 'creativity'], parentNote: '✅ Clever and funny. Meta humor that appeals to kids and adults. Safe.', alternatives: [] },

  // ── MORE MOVIES ──
  { name: 'Inside Out 2', type: 'movie', ageRating: 6, officialRating: 'PG', themes: ['positive', 'empathy', 'educational'], parentNote: '✅ Excellent film about anxiety and emotions. Great conversation starter with your child about feelings.', alternatives: [] },
  { name: 'Frozen', type: 'movie', ageRating: 5, officialRating: 'PG', themes: ['positive', 'empathy', 'creativity'], parentNote: '✅ Classic family film. Themes of sisterly love and self-acceptance.', alternatives: [] },
  { name: 'Encanto', type: 'movie', ageRating: 5, officialRating: 'PG', themes: ['positive', 'empathy', 'creativity'], parentNote: '✅ Beautiful film about family expectations and being yourself.', alternatives: [] },
  { name: 'Moana', type: 'movie', ageRating: 5, officialRating: 'PG', themes: ['positive', 'teamwork', 'creativity'], parentNote: '✅ Empowering adventure. Strong female lead. Safe for all ages.', alternatives: [] },
  { name: 'Spider-Man: Across the Spider-Verse', type: 'movie', ageRating: 8, officialRating: 'PG', themes: ['violence', 'positive', 'teamwork'], parentNote: 'Animated action. Moderate cartoon violence. Fast-paced visuals may be intense for under 7.', alternatives: [] },
  { name: 'Turning Red', type: 'movie', ageRating: 8, officialRating: 'PG', themes: ['positive', 'empathy', 'humor', 'body-image'], parentNote: '✅ Great film about puberty, identity, and mother-daughter relationships. Age-appropriate handling of growing up.', alternatives: [] },
  { name: 'Oppenheimer', type: 'movie', ageRating: 15, officialRating: 'R', themes: ['violence', 'sexual', 'nudity'], parentNote: 'Historical drama with nudity, sex scenes, and themes of mass destruction. Not for under 14.', alternatives: [] },
  { name: 'Deadpool', type: 'movie', ageRating: 17, officialRating: 'R', themes: ['violence', 'gore', 'sexual', 'profanity'], parentNote: '⚠️ Despite being a superhero movie, this is extremely violent and crude. Not for minors.', alternatives: ['Spider-Man: Across the Spider-Verse'] },
  { name: 'Five Nights at Freddy\'s', type: 'movie', ageRating: 13, officialRating: 'PG-13', themes: ['horror', 'violence'], parentNote: 'Based on the game. Jump scares and horror themes. Very popular with 8-12 year olds but may be too scary for under 10.', alternatives: [] },
  { name: 'Elemental', type: 'movie', ageRating: 5, officialRating: 'PG', themes: ['positive', 'empathy'], parentNote: '✅ Pixar film about diversity and acceptance. Safe for all ages.', alternatives: [] },
  { name: 'Wonka', type: 'movie', ageRating: 5, officialRating: 'PG', themes: ['positive', 'creativity', 'humor'], parentNote: '✅ Charming family film. Safe and fun.', alternatives: [] },

  // ── MORE YOUTUBE ──
  { name: 'MrBeast', type: 'youtube', ageRating: 8, officialRating: 'N/A', themes: ['positive', 'humor', 'consumerism'], parentNote: 'Hugely popular. Generally positive but promotes extreme consumerism and money worship. Good entertainment, discuss values.', alternatives: ['Mark Rober'] },
  { name: 'Mark Rober', type: 'youtube', ageRating: 8, officialRating: 'N/A', themes: ['educational', 'creativity', 'positive'], parentNote: '✅ Former NASA engineer. Excellent science content. Entertaining and educational.', alternatives: [] },
  { name: 'Dude Perfect', type: 'youtube', ageRating: 6, officialRating: 'N/A', themes: ['positive', 'humor', 'teamwork'], parentNote: '✅ Trick shots and sports entertainment. Clean, family-friendly content.', alternatives: [] },
  { name: 'Dream', type: 'youtube', ageRating: 10, officialRating: 'N/A', themes: ['humor', 'creativity'], parentNote: 'Minecraft YouTuber. Content is safe but fan community (Dream SMP) can have mature themes and toxic drama.', alternatives: ['Stampy'] },
  { name: 'Stampy', type: 'youtube', ageRating: 5, officialRating: 'N/A', themes: ['creativity', 'positive', 'educational'], parentNote: '✅ One of the safest Minecraft YouTubers. Specifically aims at young audiences. Clean language.', alternatives: [] },
  { name: 'Ryan\'s World', type: 'youtube', ageRating: 3, officialRating: 'N/A', themes: ['positive', 'educational', 'consumerism'], parentNote: 'Safe for young kids but heavily commercialized. Every video promotes Ryan\'s product line.', alternatives: ['Blippi'] },
  { name: 'Blippi', type: 'youtube', ageRating: 2, officialRating: 'N/A', themes: ['educational', 'positive'], parentNote: '✅ Educational content for toddlers and preschoolers. Safe. Some parents find it annoying but kids love it.', alternatives: [] },
  { name: 'PewDiePie', type: 'youtube', ageRating: 14, officialRating: 'N/A', themes: ['humor', 'profanity'], parentNote: 'Gaming/commentary. Frequent profanity and edgy humor. Controversial past incidents. Not for under 13.', alternatives: ['Jacksepticeye'] },
  { name: 'Kurzgesagt', type: 'youtube', ageRating: 10, officialRating: 'N/A', themes: ['educational', 'creativity', 'positive'], parentNote: '✅ Stunning animated science videos. Topics include space, biology, philosophy. Excellent educational content.', alternatives: ['TED-Ed'] },
  { name: 'Unspeakable', type: 'youtube', ageRating: 7, officialRating: 'N/A', themes: ['humor', 'positive'], parentNote: '✅ Minecraft and challenge videos. Clean language, kid-friendly. One of the safer gaming YouTubers.', alternatives: ['Stampy'] },
  { name: 'SSSniperWolf', type: 'youtube', ageRating: 13, officialRating: 'N/A', themes: ['humor', 'profanity'], parentNote: 'Reaction videos. Occasional inappropriate jokes and themes. Controversy around content stealing. Not for under 12.', alternatives: [] },
  { name: 'Aphmau', type: 'youtube', ageRating: 8, officialRating: 'N/A', themes: ['creativity', 'humor', 'positive'], parentNote: '✅ Minecraft roleplay. Generally kid-friendly with some mild drama themes. Popular with 8-12 year olds.', alternatives: [] },

  // ── TIKTOK CREATORS ──
  { name: 'Charli D\'Amelio', type: 'tiktok', ageRating: 13, officialRating: 'N/A', themes: ['body-image', 'positive'], parentNote: 'Dance content. Generally safe but promotes appearance-focused culture. Discuss body image.', alternatives: [] },
  { name: 'Khaby Lame', type: 'tiktok', ageRating: 8, officialRating: 'N/A', themes: ['humor', 'positive'], parentNote: '✅ Silent comedy, reaction videos. Clean, universally funny. Safe for all ages.', alternatives: [] },
  { name: 'Addison Rae', type: 'tiktok', ageRating: 13, officialRating: 'N/A', themes: ['body-image', 'consumerism'], parentNote: 'Dance and lifestyle content. Promotes beauty standards and consumerism. Discuss with teens.', alternatives: [] },
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
  const dangerousThemes: ThemeTag[] = [
    'violence', 'gore', 'sexual', 'nudity', 'drugs', 'suicide', 'eating-disorder',
    'radicalization', 'predator-risk', 'misogyny', 'toxic-masculinity',
    'self-harm-promotion', 'dangerous-challenges', 'hate-speech',
    'scam', , 'weaponry', 'stalking', 'doxxing',
    'revenge-porn', 'sextortion', 'gambling',
  ];

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
