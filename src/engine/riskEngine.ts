export type ThreatCategory = 'grooming' | 'bullying' | 'selfHarm' | 'violence' | 'contentWellness';

export interface RiskAlert {
  id: string;
  category: ThreatCategory;
  score: number;
  snippet: string;
  sourceApp: string;
  timestamp: string;
  reviewed: boolean;
}

export interface RiskResult {
  category: ThreatCategory;
  score: number;
  triggeredPatterns: string[];
}

const THRESHOLD = 50;

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

// ── GROOMING ──────────────────────────────────────────────────

function scoreGrooming(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /how old are you/i, /what grade/i, /you look older/i, /mature for your age/i,
    /you.re (so |really )?(pretty|beautiful|handsome|cute|hot)/i,
  ])) { score += 20; triggered.push('age_probe_flattery'); }

  if (matchesAny(text, [
    /don.t tell/i, /keep.*(secret|between us)/i, /our (little )?secret/i,
    /(parents|mom|dad|mum).*(don.t|wouldn.t) understand/i, /just between (you and me|us)/i,
  ])) { score += 30; triggered.push('secrecy_isolation'); }

  if (matchesAny(text, [
    /send.*(pic|photo|selfie|vid)/i, /show me (what you look|yourself)/i,
    /(camera|cam) on/i, /what are you wearing/i,
  ])) { score += 25; triggered.push('photo_request'); }

  if (matchesAny(text, [
    /(meet|hang out|come over)/i, /where do you live/i,
    /what.s your address/i, /pick you up/i,
  ])) { score += 25; triggered.push('meetup_location'); }

  if (matchesAny(text, [
    /(buy|get|give) you/i, /(robux|v.?bucks|gift.?card|money)/i,
    /i.ll (send|give|pay)/i,
  ])) { score += 15; triggered.push('gift_bribery'); }

  return [Math.min(score, 100), triggered];
}

// ── BULLYING ──────────────────────────────────────────────────

function scoreBullying(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /(you.re|ur) (ugly|fat|stupid|dumb|worthless|pathetic|trash|garbage|disgusting)/i,
    /kill yourself/i, /kys/i, /go die/i,
  ])) { score += 35; triggered.push('direct_insult'); }

  if (matchesAny(text, [
    /nobody likes you/i, /everyone hates you/i,
    /no one (likes|wants|cares about) you/i, /you have no friends/i,
  ])) { score += 25; triggered.push('social_rejection'); }

  if (matchesAny(text, [
    /(i.ll|we.ll|gonna) (beat|hurt|punch|kick|destroy|ruin) you/i,
    /watch your back/i, /you.re (dead|done|finished)/i,
  ])) { score += 35; triggered.push('threat'); }

  if (matchesAny(text, [
    /(everyone|they all) (knows?|saw|thinks)/i,
    /(i.ll|gonna) (tell|show) everyone/i, /(screenshot|screenshotted|recorded)/i,
  ])) { score += 25; triggered.push('social_exclusion'); }

  return [Math.min(score, 100), triggered];
}

// ── SELF-HARM ─────────────────────────────────────────────────

function scoreSelfHarm(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /(i |i.m ).*(cut|cutting|harm|hurting) (myself|my)/i,
    /want to (die|disappear|end it)/i,
    /don.t want to (be alive|live|exist|be here)/i,
    /(life|living) is(n.t| not) worth/i, /better off (dead|without me)/i,
  ])) { score += 50; triggered.push('self_harm_statement'); }

  if (matchesAny(text, [
    /(nobody|no one) (cares|would notice|would miss)/i,
    /can.t (take|do) (this|it) anymore/i,
    /goodbye.*(forever|for good)/i, /i.m (done|giving up|finished)/i,
  ])) { score += 40; triggered.push('hopelessness_farewell'); }

  if (matchesAny(text, [
    /(pills|overdose|jump|bridge|rope|blade|razor)/i,
    /how to.*(painless|end|die)/i, /(suicide|suicidal)/i,
  ])) { score += 45; triggered.push('method_discussion'); }

  return [Math.min(score, 100), triggered];
}

// ── VIOLENCE ──────────────────────────────────────────────────

function scoreViolence(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /(bring|bringing|got|have) a (gun|knife|weapon)/i,
    /(shoot|stab|bomb|blow up|attack)/i,
    /(shoot|blow) up.*(school|class|building)/i,
    /they.ll (all )?pay/i, /make them (pay|suffer|regret)/i,
  ])) { score += 50; triggered.push('violence_threat'); }

  if (matchesAny(text, [
    /(plan|planning|gonna|going to).*(attack|hurt|kill)/i,
    /(tomorrow|friday|monday|after school).*(do it|make my move)/i,
    /(target|hit list|list of)/i,
  ])) { score += 45; triggered.push('planning_language'); }

  if (matchesAny(text, [
    /(they deserve|the world will see|remember my name)/i,
    /(final act|final message|this is why)/i,
  ])) { score += 35; triggered.push('manifesto_language'); }

  return [Math.min(score, 100), triggered];
}

// ── DANISH PATTERNS ───────────────────────────────────────────

function scoreGroomingDa(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /hvor gammel er du/i, /du ser ældre ud/i, /moden for din alder/i,
    /du er (så |rigtig )?(smuk|pæn|sød|lækker|flot)/i,
  ])) { score += 20; triggered.push('da_flattery'); }

  if (matchesAny(text, [
    /sig det ikke til/i, /(vores|vores lille) hemmelighed/i,
    /bare mellem os/i, /dine forældre forstår/i,
  ])) { score += 30; triggered.push('da_secrecy'); }

  if (matchesAny(text, [
    /send.*(billede|foto|selfie|video)/i, /vis mig (dig selv|dig)/i,
    /hvad har du på/i, /tænd (kameraet|cam)/i,
  ])) { score += 25; triggered.push('da_photo'); }

  if (matchesAny(text, [
    /skal vi mødes/i, /hvor bor du/i, /jeg kan hente dig/i,
    /kom (herover|over til mig)/i,
  ])) { score += 25; triggered.push('da_meetup'); }

  return [Math.min(score, 100), triggered];
}

function scoreBullyingDa(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /du er (grim|dum|fed|klam|patetisk|værdiløs)/i,
    /hold kæft/i, /du er en taber/i, /slå dig selv ihjel/i,
  ])) { score += 35; triggered.push('da_insult'); }

  if (matchesAny(text, [
    /ingen kan lide dig/i, /alle hader dig/i, /du har ingen venner/i,
  ])) { score += 25; triggered.push('da_rejection'); }

  if (matchesAny(text, [
    /jeg (tæver|smadrer|banker) dig/i, /pas på dig selv/i,
    /du er (død|færdig)/i,
  ])) { score += 35; triggered.push('da_threat'); }

  return [Math.min(score, 100), triggered];
}

function scoreSelfHarmDa(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /jeg vil (dø|ikke leve|ikke være her)/i,
    /jeg (skærer|cutter|skader) mig selv/i, /livet er ikke værd/i,
  ])) { score += 50; triggered.push('da_self_harm'); }

  if (matchesAny(text, [
    /ingen ville savne mig/i, /jeg kan ikke mere/i,
    /farvel (for altid|for evigt)/i, /jeg giver op/i,
  ])) { score += 40; triggered.push('da_hopelessness'); }

  if (matchesAny(text, [
    /(piller|overdosis|bro|klinge|barberblad)/i,
    /(selvmord|selvmordsrig)/i,
  ])) { score += 45; triggered.push('da_method'); }

  return [Math.min(score, 100), triggered];
}

function scoreViolenceDa(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /jeg (tager|har|medbringer) en (kniv|pistol|våben)/i,
    /(skyde|stikke|bombe|sprænge|angribe)/i,
    /de skal (alle )?betale/i,
  ])) { score += 50; triggered.push('da_violence'); }

  if (matchesAny(text, [
    /(planlægger|vil|skal).*(angribe|slå|dræbe)/i,
    /(i morgen|fredag|efter skole).*(gør jeg det)/i,
    /(mål|hitliste)/i,
  ])) { score += 45; triggered.push('da_planning'); }

  return [Math.min(score, 100), triggered];
}

// ── CONTENT WELLNESS (harmful trends, body image, extreme content) ────

function scoreContentWellness(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  // Body image / appearance obsession
  if (matchesAny(text, [
    /i('m| am) (so )?(fat|ugly|disgusting|gross)/i,
    /i (hate|can't stand) (my body|how i look|myself)/i,
    /wish i (looked like|was as skinny|was as pretty)/i,
    /thigh gap/i, /flat stomach/i, /body check/i,
    /(calorie|cal) count/i, /fasting (for|challenge)/i,
    /i (need to|have to|must) lose weight/i,
    /pro.?ana/i, /thinspo/i, /meanspo/i,
  ])) { score += 40; triggered.push('body_image'); }

  // Harmful challenges / trends
  if (matchesAny(text, [
    /(challenge|trend).*(dangerous|hurt|pain|choke|blackout)/i,
    /blackout challenge/i, /choking (game|challenge)/i,
    /tide pod/i, /benadryl challenge/i,
    /dare me to/i, /i dare you/i,
    /(cutting|burn).*(challenge|trend|tiktok)/i,
  ])) { score += 50; triggered.push('harmful_challenge'); }

  // Extreme / radicalising content
  if (matchesAny(text, [
    /red.?pill/i, /black.?pill/i, /incel/i,
    /(women|girls) are (all|just|only)/i,
    /sigma (male|grindset)/i,
    /alpha (male|mentality)/i,
    /andrew tate/i,
    /(race|white|replacement).*(war|power|supremacy)/i,
  ])) { score += 35; triggered.push('extreme_content'); }

  // Comparison / social media pressure
  if (matchesAny(text, [
    /everyone (else )?(is|looks) (better|prettier|skinnier|happier)/i,
    /i('ll| will) never (be|look) (like|as good)/i,
    /my life (sucks|is trash|is worthless) compared/i,
    /why can.t i (look|be) like/i,
    /she.s (so much|way) (prettier|skinnier|better)/i,
  ])) { score += 30; triggered.push('social_comparison'); }

  // Danish body image / trends
  if (matchesAny(text, [
    /jeg er (så )?(fed|grim|klam)/i,
    /jeg hader (min krop|hvordan jeg ser ud)/i,
    /jeg skal tabe mig/i,
    /alle andre er (pænere|tyndere|bedre)/i,
  ])) { score += 40; triggered.push('da_body_image'); }

  return [Math.min(score, 100), triggered];
}

// ── ADULT / 18+ CONTENT ──────────────────────────────────────

function scoreAdultContent(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  // Explicit sexual content references
  if (matchesAny(text, [
    /porn(hub|o)?/i, /onlyfans/i, /xvideos/i, /xhamster/i,
    /xxx/i, /hentai/i, /nsfw/i,
    /nude(s)?/i, /nudes/i, /leaked (pics|photos|nudes)/i,
    /sex (video|tape|chat)/i,
  ])) { score += 50; triggered.push('explicit_content'); }

  // Seeking / sharing adult content
  if (matchesAny(text, [
    /send (me )?(nudes|pics|naked)/i,
    /link to.*(porn|nsfw|xxx)/i,
    /anyone got.*(nudes|leak|nsfw)/i,
    /check (this|out).*(nsfw|18\+|adult)/i,
    /age (verify|verification|check).*(bypass|skip|fake)/i,
  ])) { score += 45; triggered.push('seeking_adult'); }

  // Drug / substance references
  if (matchesAny(text, [
    /where (to|can i) (buy|get).*(weed|molly|ecstasy|acid|shrooms|xanax|coke)/i,
    /plug for.*(weed|drugs|pills)/i,
    /(let.s|wanna) (get high|smoke|trip|roll)/i,
    /fake id/i,
  ])) { score += 40; triggered.push('substance'); }

  // Gambling
  if (matchesAny(text, [
    /(bet|betting|gambl).*(site|app|link)/i,
    /csgo.*(skin|gambling|bet)/i,
    /stake\.com/i, /roobet/i,
    /(crypto|nft).*(pump|moon|100x)/i,
  ])) { score += 35; triggered.push('gambling'); }

  // Danish adult content
  if (matchesAny(text, [
    /porno/i, /nøgenbilleder/i,
    /send.*(nøgen|nøgne)/i,
    /falsk id/i,
  ])) { score += 45; triggered.push('da_adult_content'); }

  return [Math.min(score, 100), triggered];
}

// ── DANGEROUS PURCHASES ─────────────────────────────────────

function scoreDangerousPurchase(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  // Weapons / knives
  if (matchesAny(text, [
    /(buy|order|get).*(knife|blade|machete|gun|pistol|bb gun|airsoft|pepper spray|taser|brass knuckles)/i,
    /where (to|can i) (buy|get|order).*(weapon|knife|gun)/i,
    /(switchblade|butterfly knife|balisong|karambit)/i,
    /link.*(buy|shop|order).*(knife|blade|weapon)/i,
  ])) { score += 50; triggered.push('weapon_purchase'); }

  // Drugs / substances
  if (matchesAny(text, [
    /(buy|order|get|score|cop).*(weed|molly|mdma|ecstasy|acid|lsd|shrooms|xanax|oxy|percs|lean|coke|cocaine|ket|ketamine|adderall|ritalin)/i,
    /(plug|dealer|connect) for/i,
    /telegram.*(plug|dealer|buy|score)/i,
    /wickr.*(plug|deal|buy)/i,
    /snap.*(plug|deal|score)/i,
    /(how much|price|cost) for.*(gram|g |oz|ounce|eighth|quarter|half)/i,
    /drop.?(off|location|spot)/i,
  ])) { score += 50; triggered.push('drug_purchase'); }

  // Vapes / nicotine
  if (matchesAny(text, [
    /(buy|order|get).*(vape|juul|elf bar|puff bar|disposable|pod|nic|nicotine)/i,
    /where (to|can i) (buy|get).*(vape|nic)/i,
    /(sell|selling|got).*(vapes?|elf bars?|puff bars?)/i,
    /anyone (got|have|selling).*(vape|nic)/i,
  ])) { score += 40; triggered.push('vape_purchase'); }

  // Fake IDs / age bypass
  if (matchesAny(text, [
    /(buy|order|get|make).*(fake id|fake.?id|faux id)/i,
    /(fake|forged) (id|identity|passport|licence|license)/i,
    /where (to|can i) get.*(fake id)/i,
    /age (verification|verify).*(bypass|hack|skip|cheat)/i,
  ])) { score += 45; triggered.push('fake_id'); }

  // Self-harm tools
  if (matchesAny(text, [
    /(buy|order|get).*(razor blades?|box cutter|exacto)/i,
    /where (to|can i) (buy|get).*(blade|cut)/i,
    /(buy|order).*(pills|tablets|medication).*(overdose|od|lots of)/i,
  ])) { score += 50; triggered.push('self_harm_tools'); }

  // Alcohol
  if (matchesAny(text, [
    /(buy|order|get).*(alcohol|vodka|whiskey|beer|wine).*(underage|under ?age|fake id)/i,
    /anyone (buying|getting|got).*(alcohol|drinks|booze) for/i,
    /(older brother|sister|friend).*(buy|get).*(alcohol|drinks|booze)/i,
  ])) { score += 35; triggered.push('alcohol_purchase'); }

  // E-commerce platform purchases (Amazon, eBay, Wish, Temu, etc.)
  if (matchesAny(text, [
    /(amazon|ebay|wish|temu|aliexpress|shein).*(order|buy|bought|cart|checkout).*(knife|blade|weapon|vape|cbd|thc|pills|supplement)/i,
    /(add to cart|just ordered|check ?out|buy now|bought).*(knife|blade|vape|elf bar|brass knuckles|pepper spray|taser|bb gun)/i,
    /(package|order|delivery).*(arrived|coming|shipped).*(knife|blade|vape|weapon)/i,
    /mom.?s (card|credit|account|amazon|paypal).*(buy|order|bought)/i,
    /dad.?s (card|credit|account|amazon|paypal).*(buy|order|bought)/i,
    /parent.?s (card|credit|account).*(buy|order)/i,
    /(stole|took|used).*(card|credit|debit|paypal|apple pay).*(buy|order)/i,
    /(secret|hide|hidden).*(order|package|delivery)/i,
  ])) { score += 45; triggered.push('ecommerce_purchase'); }

  // Danish purchase patterns
  if (matchesAny(text, [
    /(køb|bestil|skaffe?).*(kniv|våben|pistol|gas ?pistol)/i,
    /(køb|bestil|skaffe?).*(hash|joint|weed|coke|kokain|ecstasy|mdma)/i,
    /(køb|bestil|skaffe?).*(vape|elf bar|nikot)/i,
    /falsk (id|legitimation|kørekort)/i,
    /(sælger|har du).*(vape|hash|joint)/i,
  ])) { score += 45; triggered.push('da_purchase'); }

  return [Math.min(score, 100), triggered];
}

// ── SLANG DECODER ───────────────────────────────────────────
// Maps current youth slang/coded language to actual meaning for detection.
// This dictionary is designed to be updated regularly as slang evolves.

const SLANG_MAP: Record<string, string> = {
  // Drug slang
  'mid': 'low quality drugs',
  'gas': 'high quality drugs/weed',
  'za': 'high quality weed',
  'pack': 'drugs for sale',
  'runtz': 'weed strain',
  'cart': 'vape cartridge',
  'dab': 'concentrated cannabis',
  'hitting my pen': 'vaping',
  'nic sick': 'nicotine overdose',
  'juuling': 'vaping nicotine',
  'rolling': 'on ecstasy/MDMA',
  'tripping': 'on psychedelics',
  'lean': 'codeine/promethazine drink',
  'percs': 'percocet/opioids',
  'bars': 'xanax pills',
  'boof': 'hide/consume drugs',
  'plug': 'drug dealer',
  'score': 'buy drugs',

  // Sexual / exploitation slang
  'smash': 'have sex with',
  'body count': 'number of sexual partners',
  'simp': 'someone overly devoted',
  'thirst trap': 'sexually suggestive photo',
  'sus': 'suspicious/suspect',
  'bussin': 'very good (sometimes sexual)',
  'gyatt': 'exclamation about attractive body',
  'rizz': 'ability to attract/charm',
  'mewing': 'jaw exercise trend (body image)',
  'looksmaxxing': 'extreme appearance optimization',
  'mogging': 'being more attractive than someone',
  'catfish': 'fake identity online',
  'finsta': 'fake/secret instagram account',

  // Violence / bullying slang
  'ops': 'opposition/enemies',
  'opp': 'opponent/enemy',
  'lacking': 'caught off guard/vulnerable',
  'smoke': 'fight/attack',
  'beef': 'conflict/dispute',
  'drill': 'violent music/activity',
  'on sight': 'will attack when seen',
  'catch a body': 'assault/kill someone',
  'slide': 'go attack someone',
  'spin the block': 'drive-by/revisit to attack',
  'pack': 'someone who was killed (disrespectful)',
  'ratio': 'public humiliation online',
  'L': 'loss/loser',
  'get ratioed': 'publicly embarrassed/outnumbered',

  // Self-harm / mental health coded
  'grippy socks': 'psychiatric hospital stay',
  'grippy sock vacation': 'psychiatric hospitalization',
  'sewerslide': 'suicide (coded to bypass filters)',
  'unalive': 'kill/die (coded to bypass filters)',
  'unaliving': 'killing/dying (coded)',
  'mascara': 'self-harm scars (coded on TikTok)',
  'cat scratches': 'self-harm marks (coded)',
  'sh': 'self-harm',
  'si': 'suicidal ideation',
  'ed': 'eating disorder',
  'mia': 'bulimia',
  'ana': 'anorexia',
  'thinspo': 'thinspiration (pro-anorexia)',
  'meanspo': 'mean-spirited thinspiration',
  'bonespo': 'bone-showing thinspiration',
  'sweetspo': 'encouraging thinspiration',

  // Predator / grooming coded
  'asl': 'age/sex/location',
  'dtf': 'down to f***',
  'wyd': 'what you doing (often approach)',
  'hmu': 'hit me up',
  'lmk': 'let me know (often solicitation)',
  'sc?': 'what is your snapchat (often predatory)',
  'add my snap': 'move to snapchat (less monitored)',
  'dm me': 'move to private messages',
  'kik': 'messaging app (associated with predators)',
  'discord kitten': 'grooming relationship dynamic',
  'sugar daddy': 'older person offering money for relationship',

  // Danish slang
  'ryge en': 'smoke a joint',
  'polle': 'joint/weed',
  'skunk': 'strong weed',
  'pille': 'pill/ecstasy',
  'snansen': 'cocaine',
  'smadre': 'beat up/destroy',
  'tæve': 'beat up',
  'klam': 'disgusting (used as insult)',
  'missen': 'the pussy (derogatory)',
};

/**
 * Decode slang in text before running through risk engine.
 * Appends decoded meanings to the original text for pattern matching.
 */
function decodeSlang(text: string): string {
  const lower = text.toLowerCase();
  const decoded: string[] = [];

  for (const [slang, meaning] of Object.entries(SLANG_MAP)) {
    if (lower.includes(slang.toLowerCase())) {
      decoded.push(meaning);
    }
  }

  return decoded.length > 0 ? text + ' [DECODED: ' + decoded.join(', ') + ']' : text;
}

// ── SLANG UPDATE MECHANISM ──────────────────────────────────
// In production: fetch updated slang dictionary from a remote endpoint.
// The endpoint returns new slang terms as they emerge.
// This runs on app launch and weekly thereafter.

const SLANG_UPDATE_URL = 'https://custorian.org/api/slang-dictionary.json';

export async function updateSlangDictionary(): Promise<void> {
  try {
    const response = await fetch(SLANG_UPDATE_URL);
    if (!response.ok) return;
    const update: Record<string, string> = await response.json();
    Object.assign(SLANG_MAP, update);
    console.log(`[Custorian] Slang dictionary updated: ${Object.keys(update).length} new terms`);
  } catch {
    // Silently fail — use built-in dictionary as fallback
  }
}

// ── MAIN ANALYZER ─────────────────────────────────────────────

// ── SEXTORTION / DOXXING / ONLINE EXPLOITATION ──────────────

function scoreSextortion(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  // Sextortion patterns
  if (matchesAny(text, [
    /i('ll| will) (share|post|send|leak) (your|the|those) (pics|photos|nudes|video)/i,
    /pay (me|up|now) or (i'll|i will|i)|send (me )?(money|\$|bitcoin|crypto) or/i,
    /everyone will see (your|the|those)/i,
    /i('ll| will) (tell|show) (everyone|your (parents|friends|school))/i,
    /screenshot.*(share|send|post)/i,
    /recorded (you|your|the)/i,
  ])) { score += 50; triggered.push('sextortion'); }

  // Doxxing
  if (matchesAny(text, [
    /i know (where you live|your (address|school|real name))/i,
    /(post|share|leak).*(address|phone|school|real name)/i,
    /doxx(ed|ing)?/i, /swat(ted|ting)?/i,
    /i('ll| will) find (you|where you live)/i,
  ])) { score += 45; triggered.push('doxxing'); }

  // Coercion for images
  if (matchesAny(text, [
    /if you don.t send.*(pics|photos|nudes)/i,
    /(prove|show) (it|me|that you).*(send|pic|photo|cam)/i,
    /you (owe|promised).*(pics|photos|nudes)/i,
    /come on just (one|send).*(pic|photo)/i,
  ])) { score += 45; triggered.push('image_coercion'); }

  // Danish sextortion
  if (matchesAny(text, [
    /jeg (deler|sender|poster) (dine|de) (billeder|fotos|nøgenbilleder)/i,
    /betal (mig|nu) ellers/i,
    /alle (vil|kommer til at) se/i,
    /jeg ved hvor du bor/i,
  ])) { score += 50; triggered.push('da_sextortion'); }

  return [Math.min(score, 100), triggered];
}

// ── INFLUENCER RADICALISATION PIPELINE ──────────────────────

function scoreRadicalisation(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  // Manosphere / misogyny pipeline
  if (matchesAny(text, [
    /andrew tate/i, /sneako/i, /fresh.?and.?fit/i,
    /top.?g/i, /high value (man|male|men)/i,
    /females? (are|ain.t|don.t)/i,
    /men are (superior|better|leaders)/i,
    /she.s (just )?a.*(hole|thot|b\*tch)/i,
    /all (women|girls|females) (are|do|want)/i,
  ])) { score += 35; triggered.push('manosphere'); }

  // Extremist content
  if (matchesAny(text, [
    /great replacement/i, /white (genocide|replacement)/i,
    /race war/i, /ethnostate/i,
    /nick fuentes/i, /groyper/i,
    /(jewish|jew|zionist).*(control|run|own)/i,
    /14.?88/i, /heil/i,
  ])) { score += 50; triggered.push('extremist'); }

  // Conspiracy radicalisation
  if (matchesAny(text, [
    /wake up.*(truth|sheeple|they don.t want)/i,
    /they.re (lying|hiding|controlling)/i,
    /do your (own )?research/i,
    /qanon/i, /deep state/i, /new world order/i,
  ])) { score += 25; triggered.push('conspiracy'); }

  return [Math.min(score, 100), triggered];
}

export function analyzeText(text: string): RiskResult | null {
  // Decode slang before analysis — appends decoded meanings for pattern matching
  const decoded = decodeSlang(text);
  const lower = decoded.toLowerCase();

  const categories: [ThreatCategory, [number, string[]]][] = [
    ['grooming', scoreGrooming(lower)],
    ['bullying', scoreBullying(lower)],
    ['selfHarm', scoreSelfHarm(lower)],
    ['violence', scoreViolence(lower)],
    // Danish
    ['grooming', scoreGroomingDa(lower)],
    ['bullying', scoreBullyingDa(lower)],
    ['selfHarm', scoreSelfHarmDa(lower)],
    ['violence', scoreViolenceDa(lower)],
    // Content wellness
    ['contentWellness', scoreContentWellness(lower)],
    // Adult content
    ['contentWellness', scoreAdultContent(lower)],
    // Sextortion / doxxing
    ['grooming', scoreSextortion(lower)],
    // Radicalisation
    ['contentWellness', scoreRadicalisation(lower)],
    // Dangerous purchases
    ['contentWellness', scoreDangerousPurchase(lower)],
  ];

  let best: { category: ThreatCategory; score: number; patterns: string[] } | null = null;

  for (const [cat, [score, patterns]] of categories) {
    if (score >= THRESHOLD && (!best || score > best.score)) {
      best = { category: cat, score, patterns };
    }
  }

  if (!best) return null;

  return {
    category: best.category,
    score: best.score,
    triggeredPatterns: best.patterns,
  };
}

export function createAlert(
  category: ThreatCategory,
  score: number,
  text: string,
  sourceApp: string = 'Test'
): RiskAlert {
  return {
    id: Date.now().toString(),
    category,
    score,
    snippet: text.substring(0, 120),
    sourceApp,
    timestamp: new Date().toISOString(),
    reviewed: false,
  };
}
