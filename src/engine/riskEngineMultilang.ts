/**
 * riskEngineMultilang.ts
 * Multi-language risk detection for GuardLayer.
 * Covers: Swedish (sv), Norwegian (no), German (de), French (fr), Arabic (ar).
 * Each language includes culturally appropriate patterns and youth slang.
 */

import type { ThreatCategory, RiskResult } from './riskEngine';

const THRESHOLD = 50;

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

// ═══════════════════════════════════════════════════════════════
// LANGUAGE DETECTION
// ═══════════════════════════════════════════════════════════════

const LANG_MARKERS: [string, RegExp[]][] = [
  ['sv', [
    /\b(jag|och|det|att|som|inte|den|har|med|var|för|ett|vad|ska|kan|dig|mig|mycket|alla)\b/i,
    /[åäö]/i,
    /\b(hej|tjena|bra|snälla|kärlek)\b/i,
  ]],
  ['no', [
    /\b(jeg|og|det|at|som|ikke|den|har|med|var|for|hva|skal|kan|deg|meg|veldig|alle)\b/i,
    /\b(hei|takk|kjempe|veldig|bra)\b/i,
    /[æøå]/i,
  ]],
  ['de', [
    /\b(ich|und|das|ist|ein|nicht|sie|mit|sich|auf|auch|noch|wie|aber|dann|wenn|oder|dich|mich)\b/i,
    /[äöüß]/i,
    /\b(hallo|danke|bitte|ja|nein|schon|sehr)\b/i,
  ]],
  ['fr', [
    /\b(je|tu|il|elle|nous|vous|les|est|pas|une|que|dans|avec|pour|sur|mais|tout|sont|cette)\b/i,
    /[éèêëàâùûçî]/i,
    /\b(bonjour|salut|merci|oui|non|très|aussi)\b/i,
  ]],
  ['ar', [
    /[\u0600-\u06FF]{2,}/,
    /\b(انا|انت|هو|هي|في|على|من|الى|هذا|ذلك|لا|نعم|كيف|لماذا)\b/,
  ]],
];

/** Detect the most likely language from the text. Returns ISO 639-1 code or 'unknown'. */
export function detectLanguage(text: string): string {
  let bestLang = 'unknown';
  let bestScore = 0;

  for (const [lang, markers] of LANG_MARKERS) {
    let score = 0;
    for (const pattern of markers) {
      const matches = text.match(new RegExp(pattern.source, pattern.flags + 'g'));
      if (matches) score += matches.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  return bestScore >= 2 ? bestLang : 'unknown';
}

// ═══════════════════════════════════════════════════════════════
// SWEDISH (sv)
// ═══════════════════════════════════════════════════════════════

function scoreGroomingSv(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /hur gammal är du/i, /vilken klass går du i/i, /du ser äldre ut/i,
    /mogen för din ålder/i,
    /du är (så |jätte)?(snygg|söt|fin|vacker|het)/i,
  ])) { score += 20; triggered.push('sv_age_flattery'); }

  if (matchesAny(text, [
    /berätta inte/i, /vår (lilla )?hemlighet/i, /bara mellan oss/i,
    /dina föräldrar (förstår|fattar) inte/i, /säg inget till/i,
  ])) { score += 30; triggered.push('sv_secrecy'); }

  if (matchesAny(text, [
    /skicka.*(bild|foto|selfie|video|nudes)/i, /visa mig (dig|dig själv)/i,
    /vad har du på dig/i, /sätt på kameran/i, /cam on/i,
  ])) { score += 25; triggered.push('sv_photo'); }

  if (matchesAny(text, [
    /ska vi (ses|träffas|hänga)/i, /var bor du/i, /jag kan hämta dig/i,
    /kom (hem till mig|över)/i, /vad är din adress/i,
  ])) { score += 25; triggered.push('sv_meetup'); }

  if (matchesAny(text, [
    /jag (kan |ska )(köpa|ge|skicka) (dig|till dig)/i,
    /(robux|v.?bucks|presentkort|pengar)/i,
  ])) { score += 15; triggered.push('sv_gift'); }

  return [Math.min(score, 100), triggered];
}

function scoreBullyingSv(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /du är (ful|tjock|dum|korkad|värdelös|äcklig|patetisk)/i,
    /ta livet av dig/i, /gå och dö/i, /döda dig själv/i, /kys/i,
    /håll käften/i, /du är en (loser|förlorare)/i,
  ])) { score += 35; triggered.push('sv_insult'); }

  if (matchesAny(text, [
    /ingen (gillar|tycker om) dig/i, /alla hatar dig/i,
    /du har inga (vänner|kompisar)/i, /ingen vill (vara|hänga) med dig/i,
  ])) { score += 25; triggered.push('sv_rejection'); }

  if (matchesAny(text, [
    /jag (ska|kommer) (slå|banka|krossa|spöa) dig/i,
    /akta dig/i, /du är (död|körd|färdig)/i,
  ])) { score += 35; triggered.push('sv_threat'); }

  if (matchesAny(text, [
    /alla (vet|har sett|tycker)/i, /jag (visar|berättar för) alla/i,
    /(screenshottat|spelat in)/i,
  ])) { score += 25; triggered.push('sv_exclusion'); }

  return [Math.min(score, 100), triggered];
}

function scoreSelfHarmSv(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /jag vill (dö|inte leva|inte vara här|försvinna)/i,
    /jag (skär|skadar|cuttar) mig( själv)?/i,
    /livet är inte värt/i, /bättre utan mig/i,
  ])) { score += 50; triggered.push('sv_self_harm'); }

  if (matchesAny(text, [
    /ingen (bryr sig|skulle sakna mig)/i, /jag (orkar|klarar) inte mer/i,
    /hejdå (för alltid|för evigt)/i, /jag ger upp/i,
  ])) { score += 40; triggered.push('sv_hopelessness'); }

  if (matchesAny(text, [
    /(tabletter|överdos|bro|blad|rakblad)/i,
    /hur man.*(dör|tar livet|smärtfritt)/i, /(självmord|suicid)/i,
  ])) { score += 45; triggered.push('sv_method'); }

  return [Math.min(score, 100), triggered];
}

function scoreViolenceSv(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /jag (tar med|har) (en |ett )?(kniv|pistol|vapen)/i,
    /(skjuta|hugga|bomba|spränga|attackera)/i,
    /de (ska|kommer) (alla )?få betala/i,
  ])) { score += 50; triggered.push('sv_violence'); }

  if (matchesAny(text, [
    /(planerar|tänker|ska).*(attackera|skada|döda)/i,
    /(imorgon|fredag|efter skolan).*(gör jag det|sätter igång)/i,
    /(mål|dödslista|lista)/i,
  ])) { score += 45; triggered.push('sv_planning'); }

  return [Math.min(score, 100), triggered];
}

// ═══════════════════════════════════════════════════════════════
// NORWEGIAN (no)
// ═══════════════════════════════════════════════════════════════

function scoreGroomingNo(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /hvor gammel er du/i, /hvilken klasse går du i/i, /du ser eldre ut/i,
    /moden for alderen din/i,
    /du er (så |skikkelig )?(pen|søt|fin|vakker|kjekk|hot)/i,
  ])) { score += 20; triggered.push('no_age_flattery'); }

  if (matchesAny(text, [
    /ikke fortell/i, /vår (lille )?hemmelighet/i, /bare mellom oss/i,
    /foreldrene dine (forstår|skjønner) ikke/i, /si det ikke til/i,
  ])) { score += 30; triggered.push('no_secrecy'); }

  if (matchesAny(text, [
    /send.*(bilde|foto|selfie|video|nudes)/i, /vis meg (deg|deg selv)/i,
    /hva har du på deg/i, /slå på kameraet/i,
  ])) { score += 25; triggered.push('no_photo'); }

  if (matchesAny(text, [
    /skal vi (møtes|henge|treffes)/i, /hvor bor du/i, /jeg kan hente deg/i,
    /kom (hjem til meg|over)/i, /hva er adressen din/i,
  ])) { score += 25; triggered.push('no_meetup'); }

  if (matchesAny(text, [
    /jeg (kan |skal )(kjøpe|gi|sende) (deg|til deg)/i,
    /(robux|v.?bucks|gavekort|penger)/i,
  ])) { score += 15; triggered.push('no_gift'); }

  return [Math.min(score, 100), triggered];
}

function scoreBullyingNo(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /du er (stygg|tjukk|dum|idiot|verdiløs|ekkelt|patetisk)/i,
    /ta livet ditt/i, /gå og dø/i, /drep deg selv/i,
    /hold kjeft/i, /du er en (taper|looser)/i,
  ])) { score += 35; triggered.push('no_insult'); }

  if (matchesAny(text, [
    /ingen liker deg/i, /alle hater deg/i,
    /du har ingen venner/i, /ingen vil (være|henge) med deg/i,
  ])) { score += 25; triggered.push('no_rejection'); }

  if (matchesAny(text, [
    /jeg (skal|kommer til å) (slå|banke|knuse) deg/i,
    /pass deg/i, /du er (død|ferdig)/i,
  ])) { score += 35; triggered.push('no_threat'); }

  if (matchesAny(text, [
    /alle (vet|har sett|synes)/i, /jeg (viser|forteller) alle/i,
    /(screenshottet|tatt opp)/i,
  ])) { score += 25; triggered.push('no_exclusion'); }

  return [Math.min(score, 100), triggered];
}

function scoreSelfHarmNo(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /jeg vil (dø|ikke leve|ikke være her|forsvinne)/i,
    /jeg (kutter|skader|skjærer) meg( selv)?/i,
    /livet er ikke verdt/i, /bedre uten meg/i,
  ])) { score += 50; triggered.push('no_self_harm'); }

  if (matchesAny(text, [
    /ingen (bryr seg|ville savnet meg)/i, /jeg (orker|klarer) ikke mer/i,
    /ha det (for alltid|for godt)/i, /jeg gir opp/i,
  ])) { score += 40; triggered.push('no_hopelessness'); }

  if (matchesAny(text, [
    /(tabletter|overdose|bru|blad|barberblad)/i,
    /hvordan man.*(dør|tar livet|smertefritt)/i, /(selvmord|suicid)/i,
  ])) { score += 45; triggered.push('no_method'); }

  return [Math.min(score, 100), triggered];
}

function scoreViolenceNo(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /jeg (tar med|har) (en |et )?(kniv|pistol|våpen)/i,
    /(skyte|stikke|bombe|sprenge|angripe)/i,
    /de (skal|kommer til å) (alle )?få betale/i,
  ])) { score += 50; triggered.push('no_violence'); }

  if (matchesAny(text, [
    /(planlegger|tenker|skal).*(angripe|skade|drepe)/i,
    /(i morgen|fredag|etter skolen).*(gjør jeg det|setter i gang)/i,
    /(mål|dødsliste|liste)/i,
  ])) { score += 45; triggered.push('no_planning'); }

  return [Math.min(score, 100), triggered];
}

// ═══════════════════════════════════════════════════════════════
// GERMAN (de)
// ═══════════════════════════════════════════════════════════════

function scoreGroomingDe(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /wie alt bist du/i, /welche klasse (bist|gehst) du/i, /du siehst älter aus/i,
    /reif für dein alter/i,
    /du bist (so |echt |richtig )?(hübsch|süß|schön|geil|hot)/i,
  ])) { score += 20; triggered.push('de_age_flattery'); }

  if (matchesAny(text, [
    /sag es (niemandem|keinem)/i, /unser (kleines )?geheimnis/i,
    /nur zwischen uns/i, /deine eltern (verstehen|würden) (das |es )?nicht/i,
    /erzähl das niemandem/i, /behalt das für dich/i,
  ])) { score += 30; triggered.push('de_secrecy'); }

  if (matchesAny(text, [
    /schick.*(bild|foto|selfie|video|nudes)/i, /zeig (dich|mir|dich mal)/i,
    /was hast du an/i, /kamera an/i, /cam an/i,
  ])) { score += 25; triggered.push('de_photo'); }

  if (matchesAny(text, [
    /wollen wir uns treffen/i, /wo wohnst du/i, /ich (hol|kann) dich ab/i,
    /komm (zu mir|rüber|vorbei)/i, /was ist deine adresse/i,
    /lass uns (treffen|sehen)/i,
  ])) { score += 25; triggered.push('de_meetup'); }

  if (matchesAny(text, [
    /ich (kauf|geb|schick) dir/i,
    /(robux|v.?bucks|gutschein|geschenkkarte|geld)/i,
  ])) { score += 15; triggered.push('de_gift'); }

  return [Math.min(score, 100), triggered];
}

function scoreBullyingDe(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /du bist (hässlich|fett|dumm|behindert|wertlos|eklig|asozial)/i,
    /bring dich um/i, /geh sterben/i, /stirb/i,
    /halt (die |dein )?(fresse|maul|klappe)/i, /du (opfer|spast|hurensohn|missgeburt)/i,
  ])) { score += 35; triggered.push('de_insult'); }

  if (matchesAny(text, [
    /keiner mag dich/i, /alle hassen dich/i,
    /du hast keine freunde/i, /niemand will (was mit dir|dich)/i,
  ])) { score += 25; triggered.push('de_rejection'); }

  if (matchesAny(text, [
    /ich (werde|werd|schlag) dich (schlagen|verprügeln|fertig machen)/i,
    /pass auf dich auf/i, /du bist (tot|erledigt|dran)/i,
    /ich (mach|krieg) dich (fertig|kaputt)/i,
  ])) { score += 35; triggered.push('de_threat'); }

  if (matchesAny(text, [
    /alle (wissen|haben gesehen|denken)/i,
    /ich (zeig|erzähl).*(allen|jedem)/i, /(screenshot|aufgenommen)/i,
  ])) { score += 25; triggered.push('de_exclusion'); }

  return [Math.min(score, 100), triggered];
}

function scoreSelfHarmDe(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /ich will (sterben|nicht mehr leben|nicht mehr hier sein|verschwinden)/i,
    /ich (ritze|schneide|verletze) mich( selbst)?/i,
    /das leben ist (es )?nicht wert/i, /besser ohne mich/i,
    /ich will nicht mehr/i,
  ])) { score += 50; triggered.push('de_self_harm'); }

  if (matchesAny(text, [
    /(niemand|keiner) (vermisst|würde|braucht) mich/i,
    /ich (kann|halt|schaff) (es |das )?nicht mehr/i,
    /tschüss (für immer|auf ewig)/i, /ich geb(e)? auf/i,
    /es ist mir (alles )?egal/i,
  ])) { score += 40; triggered.push('de_hopelessness'); }

  if (matchesAny(text, [
    /(tabletten|überdosis|brücke|klinge|rasieklinge)/i,
    /wie man.*(schmerzlos|stirbt|umbringt)/i, /(selbstmord|suizid)/i,
  ])) { score += 45; triggered.push('de_method'); }

  return [Math.min(score, 100), triggered];
}

function scoreViolenceDe(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /ich (bringe|hab|habe) (ein |eine )?(messer|pistole|waffe|knarre)/i,
    /(schießen|stechen|bomben|sprengen|angreifen|abstechen)/i,
    /die (werden|sollen) (alle )?bezahlen/i, /amoklauf/i,
  ])) { score += 50; triggered.push('de_violence'); }

  if (matchesAny(text, [
    /(plane|planen|werde|will).*(angreifen|verletzen|töten|umbringen)/i,
    /(morgen|freitag|nach der schule).*(mach ich es|geht es los)/i,
    /(ziel|todesliste|liste)/i,
  ])) { score += 45; triggered.push('de_planning'); }

  return [Math.min(score, 100), triggered];
}

// ═══════════════════════════════════════════════════════════════
// FRENCH (fr)
// ═══════════════════════════════════════════════════════════════

function scoreGroomingFr(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /t.as quel âge/i, /tu as quel âge/i, /tu es en quelle classe/i,
    /tu fais plus (vieille|vieux|grande|grand)/i, /mature pour ton âge/i,
    /tu es (trop |vraiment )?(belle|beau|mignon|mignonne|canon|chaud)/i,
    /t.es (trop |vraiment )?(belle|beau|mignon|mignonne|canon)/i,
  ])) { score += 20; triggered.push('fr_age_flattery'); }

  if (matchesAny(text, [
    /dis.le à personne/i, /(notre|not) (petit )?secret/i,
    /juste entre (nous|toi et moi)/i, /tes parents (comprendraient|comprennent) pas/i,
    /faut (pas|rien) dire/i, /raconte à personne/i,
  ])) { score += 30; triggered.push('fr_secrecy'); }

  if (matchesAny(text, [
    /envoie.*(photo|selfie|vidéo|nude|image)/i, /montre.?(moi|toi)/i,
    /t.es habillé(e)? comment/i, /allume (la |ta )?cam/i,
    /tu portes quoi/i,
  ])) { score += 25; triggered.push('fr_photo'); }

  if (matchesAny(text, [
    /on (se voit|se retrouve|se rejoint)/i, /tu habites où/i,
    /je (peux |vais )?(te |venir te )?(chercher|récupérer)/i,
    /viens chez moi/i, /c.est quoi ton adresse/i,
  ])) { score += 25; triggered.push('fr_meetup'); }

  if (matchesAny(text, [
    /je (t.achète|te donne|t.envoie)/i,
    /(robux|v.?bucks|carte.?cadeau|argent)/i,
  ])) { score += 15; triggered.push('fr_gift'); }

  return [Math.min(score, 100), triggered];
}

function scoreBullyingFr(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /t.es (moche|gros|grosse|con|conne|nul|nulle|dégueulasse|pathétique)/i,
    /tu es (moche|gros|grosse|con|conne|nul|nulle)/i,
    /va (te |)(tuer|mourir|crever)/i, /tue.?toi/i, /crève/i,
    /(ta gueule|ferme.?la|ferme ta gueule)/i,
    /t.es (un|une) (bouffon|bouffonne|tocard|tocarde|cas soc|cassos)/i,
  ])) { score += 35; triggered.push('fr_insult'); }

  if (matchesAny(text, [
    /personne (t.aime|te kiffe|veut de toi)/i, /tout le monde te déteste/i,
    /t.as (aucun|pas d.) ami/i, /personne veut (être|traîner) avec toi/i,
  ])) { score += 25; triggered.push('fr_rejection'); }

  if (matchesAny(text, [
    /je vais te (frapper|défoncer|péter|casser|démonter|tabasser)/i,
    /fais gaffe/i, /t.es (mort|morte|fini|finie)/i,
    /on va te (péter|régler|niquer)/i,
  ])) { score += 35; triggered.push('fr_threat'); }

  if (matchesAny(text, [
    /tout le monde (sait|a vu|pense)/i,
    /je (montre|dis) à tout le monde/i, /(screenshot|enregistré|capturé)/i,
  ])) { score += 25; triggered.push('fr_exclusion'); }

  return [Math.min(score, 100), triggered];
}

function scoreSelfHarmFr(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /je veux (mourir|plus vivre|plus être là|disparaître)/i,
    /je me (coupe|scarifie|mutile|fais du mal)/i,
    /la vie (vaut|ne vaut) (pas|rien)/i, /mieux sans moi/i,
    /j.en (peux|ai) plus/i,
  ])) { score += 50; triggered.push('fr_self_harm'); }

  if (matchesAny(text, [
    /personne (s.en fout|me remarquerait|me manquerait)/i,
    /je (n.en |)(peux|arrive) plus/i,
    /adieu (pour toujours|pour de bon)/i, /j.abandonne/i,
  ])) { score += 40; triggered.push('fr_hopelessness'); }

  if (matchesAny(text, [
    /(cachets|comprimés|surdose|overdose|pont|lame|rasoir)/i,
    /comment.*(mourir|sans douleur|en finir)/i, /suicide/i,
    /en finir (avec tout|avec la vie)/i,
  ])) { score += 45; triggered.push('fr_method'); }

  return [Math.min(score, 100), triggered];
}

function scoreViolenceFr(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /j.ai (un |une )?(couteau|flingue|arme|pistolet)/i,
    /j.amène (un |une )?(couteau|arme|flingue)/i,
    /(tirer|poignarder|exploser|attaquer)/i,
    /ils vont (tous )?payer/i, /je vais (les |tous les )?(buter|tuer)/i,
  ])) { score += 50; triggered.push('fr_violence'); }

  if (matchesAny(text, [
    /(planifie|prévois|vais).*(attaquer|blesser|tuer)/i,
    /(demain|vendredi|après les cours).*(je passe à l.acte|c.est le jour)/i,
    /(cible|liste (noire|de mort))/i,
  ])) { score += 45; triggered.push('fr_planning'); }

  return [Math.min(score, 100), triggered];
}

// ═══════════════════════════════════════════════════════════════
// ARABIC (ar)
// ═══════════════════════════════════════════════════════════════

function scoreGroomingAr(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /كم عمرك/,
    /في أي صف أنت/,
    /تبين(ي)? أكبر من عمرك/,
    /ناضج(ة)? لعمرك/,
    /أنت(ي)? (كتير |مرة |وايد )?(حلو|حلوة|جميل|جميلة|كيوت)/,
    /ما شاء الله عليك/,
  ])) { score += 20; triggered.push('ar_age_flattery'); }

  if (matchesAny(text, [
    /لا تقول(ي)? لأحد/,
    /سرنا/,
    /بيننا (بس|فقط)/,
    /أهلك (ما |مش )?(يفهمو|بيفهمو|راح يفهمو)/,
    /لا تخبر(ي)? (أحد|حد)/,
    /خلي الموضوع بيننا/,
  ])) { score += 30; triggered.push('ar_secrecy'); }

  if (matchesAny(text, [
    /ارسل(ي)?.*صور(ة|تك)?/,
    /ورجي(ني)? (نفسك|وجهك|حالك)/,
    /شو لابس(ة)?/,
    /شغل(ي)? الكام(يرا)?/,
    /ابي اشوفك/,
    /صورة سيلفي/,
  ])) { score += 25; triggered.push('ar_photo'); }

  if (matchesAny(text, [
    /نتقابل/,
    /وين (ساكن|ساكنة|تسكن|بيتك)/,
    /أجي أخذك/,
    /تعال(ي)? عندي/,
    /وين عنوانك/,
    /نطلع (سوا|مع بعض)/,
  ])) { score += 25; triggered.push('ar_meetup'); }

  if (matchesAny(text, [
    /أشتري(لك)? /,
    /أرسل(لك)? (فلوس|هدية)/,
    /(روبوكس|بطاقة هدية|فلوس)/,
  ])) { score += 15; triggered.push('ar_gift'); }

  return [Math.min(score, 100), triggered];
}

function scoreBullyingAr(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /أنت(ي)? (قبيح|قبيحة|سمين|سمينة|غبي|غبية|تافه|تافهة|مقرف|مقرفة)/,
    /روح (موت|مت|انتحر)/,
    /اقتل نفسك/,
    /(اسكت|اسكتي|سكر تمك|سد بوزك)/,
    /يا (حمار|حمارة|كلب|حيوان)/,
  ])) { score += 35; triggered.push('ar_insult'); }

  if (matchesAny(text, [
    /ما(حد|أحد) يحبك/,
    /الكل يكرهك/,
    /ما عندك (أصحاب|صحاب|اصدقاء)/,
    /ماحد يبي(ك| يكون معك)/,
  ])) { score += 25; triggered.push('ar_rejection'); }

  if (matchesAny(text, [
    /بضربك/,
    /راح (أضربك|أكسرك|أدمرك)/,
    /انتبه لنفسك/,
    /أنت(ي)? (ميت|خلاص|منته)/,
    /بخليك تندم/,
  ])) { score += 35; triggered.push('ar_threat'); }

  if (matchesAny(text, [
    /الكل (يعرف|شاف|يقول)/,
    /بقول (للكل|لكل الناس)/,
    /(سكرين شوت|صورت الشاشة|سجلت)/,
  ])) { score += 25; triggered.push('ar_exclusion'); }

  return [Math.min(score, 100), triggered];
}

function scoreSelfHarmAr(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /أبي (أموت|انتحر)/,
    /ابي اموت/,
    /ما أبي أعيش/,
    /أريد (أموت|الموت)/,
    /ما ابي اكون هنا/,
    /(أجرح|أأذي) نفسي/,
    /الحياة ما تسوى/,
    /أحسن بدوني/,
  ])) { score += 50; triggered.push('ar_self_harm'); }

  if (matchesAny(text, [
    /ما(حد|أحد) (يهتم|بيفتقدني|يحس فيني)/,
    /ما أقدر (أكمل|أستحمل)/,
    /وداعا (للأبد|يا دنيا)/,
    /استسلمت/,
  ])) { score += 40; triggered.push('ar_hopelessness'); }

  if (matchesAny(text, [
    /(حبوب|جرعة زايدة|جسر|شفرة|موس)/,
    /كيف (أموت|انتحر|بدون ألم)/,
    /(انتحار|انتحاري)/,
  ])) { score += 45; triggered.push('ar_method'); }

  return [Math.min(score, 100), triggered];
}

function scoreViolenceAr(text: string): [number, string[]] {
  let score = 0;
  const triggered: string[] = [];

  if (matchesAny(text, [
    /معي (سكين|مسدس|سلاح)/,
    /عندي (سكين|مسدس|سلاح)/,
    /(أطلق النار|أطعن|أفجر|أهاجم)/,
    /بيدفعو(ا)? الثمن/,
    /راح يدفعون الثمن/,
  ])) { score += 50; triggered.push('ar_violence'); }

  if (matchesAny(text, [
    /(أخطط|ناوي|بسوي).*(هجوم|أأذي|أقتل)/,
    /(بكرا|يوم الجمعة|بعد المدرسة).*(أسويها|ينفذ)/,
    /(هدف|قائمة (الموت|سوداء))/,
  ])) { score += 45; triggered.push('ar_planning'); }

  return [Math.min(score, 100), triggered];
}

// ═══════════════════════════════════════════════════════════════
// MAIN MULTI-LANGUAGE ANALYZER
// ═══════════════════════════════════════════════════════════════

type ScorerFn = (text: string) => [number, string[]];

interface LangScorers {
  grooming: ScorerFn;
  bullying: ScorerFn;
  selfHarm: ScorerFn;
  violence: ScorerFn;
}

const LANG_SCORERS: Record<string, LangScorers> = {
  sv: { grooming: scoreGroomingSv, bullying: scoreBullyingSv, selfHarm: scoreSelfHarmSv, violence: scoreViolenceSv },
  no: { grooming: scoreGroomingNo, bullying: scoreBullyingNo, selfHarm: scoreSelfHarmNo, violence: scoreViolenceNo },
  de: { grooming: scoreGroomingDe, bullying: scoreBullyingDe, selfHarm: scoreSelfHarmDe, violence: scoreViolenceDe },
  fr: { grooming: scoreGroomingFr, bullying: scoreBullyingFr, selfHarm: scoreSelfHarmFr, violence: scoreViolenceFr },
  ar: { grooming: scoreGroomingAr, bullying: scoreBullyingAr, selfHarm: scoreSelfHarmAr, violence: scoreViolenceAr },
};

/**
 * Analyze text across all supported languages (sv, no, de, fr, ar).
 * Returns the highest-scoring RiskResult above threshold, or null.
 */
export function analyzeMultilang(text: string): RiskResult | null {
  const lower = text.toLowerCase();

  const categories: [ThreatCategory, [number, string[]]][] = [];

  for (const scorers of Object.values(LANG_SCORERS)) {
    categories.push(
      ['grooming', scorers.grooming(lower)],
      ['bullying', scorers.bullying(lower)],
      ['selfHarm', scorers.selfHarm(lower)],
      ['violence', scorers.violence(lower)],
    );
  }

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
