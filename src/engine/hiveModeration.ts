/**
 * Hive Moderation API — Visual Content Classification
 *
 * More granular than Google Vision SafeSearch.
 * Detects: explicit, suggestive, violence, gore, drugs, weapons, self-harm, hate symbols
 * Used by: Reddit, Bumble, Giphy
 * Free: 5,000 requests/month
 * Docs: https://docs.thehive.ai
 * Get key: https://thehive.ai/register
 */

const HIVE_API_KEY = process.env.HIVE_API_KEY || '';
const HIVE_ENDPOINT = 'https://api.thehive.ai/api/v2/task/sync';

export interface HiveClassification {
  category: string;
  score: number;  // 0-1
}

export interface HiveModerationResult {
  explicit: number;         // 0-1 — nudity, sexual content
  suggestive: number;       // 0-1 — suggestive but not explicit
  violence: number;         // 0-1 — violent imagery
  gore: number;             // 0-1 — graphic violence
  drugs: number;            // 0-1 — drug use/paraphernalia
  weapons: number;          // 0-1 — guns, knives, etc.
  selfHarm: number;         // 0-1 — cutting, self-injury imagery
  hateSymbols: number;      // 0-1 — hate symbols, extremist imagery
  isRisky: boolean;
  riskScore: number;        // 0-100
  dominantCategory: string;
  allClasses: HiveClassification[];
}

export async function moderateImageHive(imageBase64: string): Promise<HiveModerationResult | null> {
  if (!HIVE_API_KEY) {
    console.log('[Custorian:Hive] No API key — skipping visual moderation');
    return null;
  }

  try {
    const res = await fetch(HIVE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${HIVE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: {
          data: imageBase64,
        },
      }),
    });

    if (!res.ok) {
      console.warn(`[Custorian:Hive] API error ${res.status}`);
      return null;
    }

    const data = await res.json();
    const output = data.status?.[0]?.response?.output || [];

    // Extract class scores from Hive's nested response
    const classScores: Record<string, number> = {};
    for (const item of output) {
      const classes = item.classes || [];
      for (const cls of classes) {
        classScores[cls.class] = cls.score;
      }
    }

    // Map Hive classes to our categories
    const explicit = Math.max(
      classScores['yes_sexual_activity'] || 0,
      classScores['yes_male_nudity'] || 0,
      classScores['yes_female_nudity'] || 0,
      classScores['yes_sexual_intent'] || 0,
    );
    const suggestive = Math.max(
      classScores['yes_suggestive'] || 0,
      classScores['yes_underwear'] || 0,
      classScores['yes_cleavage'] || 0,
    );
    const violence = classScores['yes_violence'] || 0;
    const gore = classScores['yes_gore'] || 0;
    const drugs = classScores['yes_drugs'] || 0;
    const weapons = classScores['yes_weapons'] || 0;
    const selfHarm = classScores['yes_self_harm'] || 0;
    const hateSymbols = classScores['yes_hate_symbols'] || 0;

    const allCategories = { explicit, suggestive, violence, gore, drugs, weapons, selfHarm, hateSymbols };
    const maxScore = Math.max(...Object.values(allCategories));
    const dominant = Object.entries(allCategories).sort((a, b) => b[1] - a[1])[0][0];

    const allClasses: HiveClassification[] = Object.entries(classScores)
      .filter(([, score]) => score > 0.3)
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => b.score - a.score);

    console.log(`[Custorian:Hive] explicit=${(explicit * 100).toFixed(0)}% violence=${(violence * 100).toFixed(0)}% selfHarm=${(selfHarm * 100).toFixed(0)}% dominant=${dominant}`);

    return {
      explicit,
      suggestive,
      violence,
      gore,
      drugs,
      weapons,
      selfHarm,
      hateSymbols,
      isRisky: maxScore >= 0.6,
      riskScore: Math.round(maxScore * 100),
      dominantCategory: dominant,
      allClasses,
    };
  } catch (error) {
    console.error('[Custorian:Hive] Moderation failed:', error);
    return null;
  }
}

/**
 * Quick check — returns true if image contains concerning content
 */
export async function isImageUnsafe(imageBase64: string, threshold: number = 0.7): Promise<boolean> {
  const result = await moderateImageHive(imageBase64);
  if (!result) return false;
  return result.explicit >= threshold ||
    result.violence >= threshold ||
    result.selfHarm >= 0.5 ||
    result.gore >= 0.5;
}
