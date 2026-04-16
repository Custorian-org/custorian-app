/**
 * Google/Jigsaw Perspective API — Text Toxicity Detection
 *
 * Detects: toxicity, severe toxicity, insults, threats, profanity, identity attacks
 * Used by: New York Times, Wikipedia, Reddit
 * Free: No rate limit for non-commercial use
 * Docs: https://perspectiveapi.com
 * Request key: https://developers.perspectiveapi.com/s/docs-get-started
 */

const PERSPECTIVE_KEY = process.env.PERSPECTIVE_API_KEY || '';
const PERSPECTIVE_ENDPOINT = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

export interface PerspectiveResult {
  toxicity: number;           // 0-1
  severeToxicity: number;     // 0-1
  insult: number;             // 0-1
  threat: number;             // 0-1
  profanity: number;          // 0-1
  identityAttack: number;     // 0-1
  isRisky: boolean;
  riskScore: number;          // 0-100
  dominantCategory: string;
}

export async function analyzeTextToxicity(
  text: string,
  language: string = 'en'
): Promise<PerspectiveResult | null> {
  if (!PERSPECTIVE_KEY) {
    console.log('[Custorian:Perspective] No API key — skipping toxicity analysis');
    return null;
  }

  if (text.length < 5) return null;

  try {
    const supportedLanguages = ['en', 'de', 'da', 'es', 'fr', 'it', 'pt', 'nl', 'sv', 'no'];
    const lang = supportedLanguages.includes(language) ? language : 'en';

    const res = await fetch(`${PERSPECTIVE_ENDPOINT}?key=${PERSPECTIVE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: { text },
        languages: [lang],
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          INSULT: {},
          THREAT: {},
          PROFANITY: {},
          IDENTITY_ATTACK: {},
        },
        doNotStore: true,  // Privacy: never store children's text
      }),
    });

    if (!res.ok) {
      console.warn(`[Custorian:Perspective] API error ${res.status}`);
      return null;
    }

    const data = await res.json();
    const scores = data.attributeScores || {};

    const toxicity = scores.TOXICITY?.summaryScore?.value || 0;
    const severeToxicity = scores.SEVERE_TOXICITY?.summaryScore?.value || 0;
    const insult = scores.INSULT?.summaryScore?.value || 0;
    const threat = scores.THREAT?.summaryScore?.value || 0;
    const profanity = scores.PROFANITY?.summaryScore?.value || 0;
    const identityAttack = scores.IDENTITY_ATTACK?.summaryScore?.value || 0;

    const allScores = { toxicity, severeToxicity, insult, threat, profanity, identityAttack };
    const maxScore = Math.max(...Object.values(allScores));
    const dominant = Object.entries(allScores).sort((a, b) => b[1] - a[1])[0][0];

    console.log(`[Custorian:Perspective] toxicity=${(toxicity * 100).toFixed(0)}% threat=${(threat * 100).toFixed(0)}% insult=${(insult * 100).toFixed(0)}%`);

    return {
      toxicity,
      severeToxicity,
      insult,
      threat,
      profanity,
      identityAttack,
      isRisky: maxScore >= 0.6,
      riskScore: Math.round(maxScore * 100),
      dominantCategory: dominant,
    };
  } catch (error) {
    console.error('[Custorian:Perspective] Analysis failed:', error);
    return null;
  }
}

/**
 * Quick check — returns true if text is likely toxic (threshold 0.7)
 * Use for keyboard extension fast-path before full analysis
 */
export async function isTextToxic(text: string, threshold: number = 0.7): Promise<boolean> {
  const result = await analyzeTextToxicity(text);
  if (!result) return false;
  return result.toxicity >= threshold || result.severeToxicity >= 0.5 || result.threat >= 0.5;
}
