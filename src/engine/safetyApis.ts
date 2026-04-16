/**
 * Professional Safety API Integrations
 *
 * Tier 1 — Self-serve, free/cheap:
 *   - Google Cloud Vision SafeSearch (image moderation)
 *   - Microsoft Azure Content Moderator (text + image)
 *   - Google/Jigsaw Perspective API (text toxicity)
 *   - Hive Moderation (granular visual classification)
 *   - Have I Been Pwned (data breach detection)
 *   - Google Web Risk (URL safety)
 *
 * Tier 2 — Application/partnership required:
 *   - Thorn Safer (CSAM hash matching)
 *   - Microsoft PhotoDNA (CSAM image fingerprinting)
 *
 * All calls are optional overlays on the on-device engine.
 * If no API key → graceful fallback to local patterns.
 */

import { ThreatCategory } from './riskEngine';

// Re-export new integrations for convenience
export { analyzeTextToxicity, isTextToxic } from './perspectiveApi';
export { moderateImageHive, isImageUnsafe } from './hiveModeration';
export { checkEmailBreach, checkPasswordExposed } from './breachCheck';
export { checkUrlSafety, scanTextForDangerousUrls } from './webRisk';

// ── API KEYS (loaded from .env via process.env) ──────────
const GOOGLE_VISION_KEY = process.env.GOOGLE_VISION_API_KEY || '';
const AZURE_CONTENT_KEY = process.env.AZURE_CONTENT_KEY || '';
const AZURE_CONTENT_ENDPOINT = process.env.AZURE_CONTENT_ENDPOINT || '';

// ── GOOGLE CLOUD VISION — SafeSearch ─────────────────────────
// Detects: adult, violence, racy, medical, spoof content in images
// Free: 1,000 images/month. $1.50/1,000 after.
// Docs: https://cloud.google.com/vision/docs/detecting-safe-search

export interface SafeSearchResult {
  adult: string;      // VERY_UNLIKELY → VERY_LIKELY
  violence: string;
  racy: string;
  medical: string;
  isRisky: boolean;
  riskScore: number;  // 0-100
}

const LIKELIHOOD_SCORES: Record<string, number> = {
  'VERY_UNLIKELY': 0,
  'UNLIKELY': 15,
  'POSSIBLE': 40,
  'LIKELY': 70,
  'VERY_LIKELY': 95,
};

export async function scanImageSafeSearch(imageBase64: string): Promise<SafeSearchResult | null> {
  if (!GOOGLE_VISION_KEY) return null;

  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
          }],
        }),
      }
    );

    const data = await res.json();
    const ss = data.responses?.[0]?.safeSearchAnnotation;
    if (!ss) return null;

    const adultScore = LIKELIHOOD_SCORES[ss.adult] || 0;
    const violenceScore = LIKELIHOOD_SCORES[ss.violence] || 0;
    const racyScore = LIKELIHOOD_SCORES[ss.racy] || 0;
    const maxScore = Math.max(adultScore, violenceScore, racyScore);

    return {
      adult: ss.adult,
      violence: ss.violence,
      racy: ss.racy,
      medical: ss.medical,
      isRisky: maxScore >= 60,
      riskScore: maxScore,
    };
  } catch {
    return null;
  }
}

// ── MICROSOFT AZURE CONTENT MODERATOR ────────────────────────
// Text moderation: profanity, PII, classification (sexual, offensive, adult)
// Image moderation: adult/racy content, OCR for text in images
// Free: 5,000 transactions/month (text), 5,000 (image)
// Docs: https://learn.microsoft.com/en-us/azure/ai-services/content-moderator/

export interface TextModerationResult {
  category1Score: number;  // Sexually explicit/mature
  category2Score: number;  // Sexually suggestive
  category3Score: number;  // Offensive
  piiDetected: boolean;
  termsFound: string[];
  isRisky: boolean;
  riskScore: number;
}

export async function moderateText(text: string): Promise<TextModerationResult | null> {
  if (!AZURE_CONTENT_KEY || !AZURE_CONTENT_ENDPOINT) return null;

  try {
    const res = await fetch(
      `${AZURE_CONTENT_ENDPOINT}/contentmoderator/moderate/v1.0/ProcessText/Screen?classify=true&PII=true`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Ocp-Apim-Subscription-Key': AZURE_CONTENT_KEY,
        },
        body: text,
      }
    );

    const data = await res.json();
    const classification = data.Classification || {};
    const cat1 = classification.Category1?.Score || 0;
    const cat2 = classification.Category2?.Score || 0;
    const cat3 = classification.Category3?.Score || 0;
    const maxScore = Math.max(cat1, cat2, cat3) * 100;

    const pii = data.PII || {};
    const piiDetected = !!(pii.Email?.length || pii.Phone?.length || pii.Address?.length);

    const terms = (data.Terms || []).map((t: any) => t.Term);

    return {
      category1Score: cat1,
      category2Score: cat2,
      category3Score: cat3,
      piiDetected,
      termsFound: terms,
      isRisky: maxScore >= 60 || piiDetected,
      riskScore: maxScore,
    };
  } catch {
    return null;
  }
}

export interface ImageModerationResult {
  adultScore: number;
  racyScore: number;
  isImageAdult: boolean;
  isImageRacy: boolean;
  isRisky: boolean;
  riskScore: number;
}

export async function moderateImage(imageBase64: string): Promise<ImageModerationResult | null> {
  if (!AZURE_CONTENT_KEY || !AZURE_CONTENT_ENDPOINT) return null;

  try {
    const res = await fetch(
      `${AZURE_CONTENT_ENDPOINT}/contentmoderator/moderate/v1.0/ProcessImage/Evaluate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          'Ocp-Apim-Subscription-Key': AZURE_CONTENT_KEY,
        },
        body: imageBase64,
      }
    );

    const data = await res.json();
    return {
      adultScore: data.AdultClassificationScore || 0,
      racyScore: data.RacyClassificationScore || 0,
      isImageAdult: data.IsImageAdultClassified || false,
      isImageRacy: data.IsImageRacyClassified || false,
      isRisky: data.IsImageAdultClassified || data.IsImageRacyClassified,
      riskScore: Math.max(data.AdultClassificationScore || 0, data.RacyClassificationScore || 0) * 100,
    };
  } catch {
    return null;
  }
}

// ── PII DETECTION (on-device fallback) ───────────────────────
// Detects when a child shares personal info in chat

export function detectPII(text: string): { type: string; match: string }[] {
  const findings: { type: string; match: string }[] = [];

  // Phone numbers (DK, US, international)
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  if (phoneMatch) findings.push({ type: 'phone', match: phoneMatch[0] });

  // Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) findings.push({ type: 'email', match: emailMatch[0] });

  // Address patterns (street + number)
  const addrMatch = text.match(/\d{1,5}\s+\w+\s+(street|st|road|rd|avenue|ave|vej|gade|allé|plads)/i);
  if (addrMatch) findings.push({ type: 'address', match: addrMatch[0] });

  // School name patterns
  const schoolMatch = text.match(/(i go to|my school is|jeg går på)\s+(\w+(\s\w+){0,3})\s*(school|skole)/i);
  if (schoolMatch) findings.push({ type: 'school', match: schoolMatch[0] });

  // Full name sharing (common pattern: "my name is X Y")
  const nameMatch = text.match(/(my name is|i'm called|jeg hedder)\s+([A-Z]\w+\s+[A-Z]\w+)/i);
  if (nameMatch) findings.push({ type: 'full_name', match: nameMatch[0] });

  return findings;
}

// ── API STATUS CHECK ─────────────────────────────────────────

export function getSafetyApiStatus(): Record<string, boolean> {
  return {
    googleVision: !!GOOGLE_VISION_KEY,
    azureContentModerator: !!(AZURE_CONTENT_KEY && AZURE_CONTENT_ENDPOINT),
    photoDNA: !!process.env.PHOTODNA_API_KEY,         // Microsoft approved — active
    perspectiveApi: !!process.env.PERSPECTIVE_API_KEY, // Google/Jigsaw text toxicity
    hiveModeration: !!process.env.HIVE_API_KEY,        // Visual content classification
    haveibeenpwned: false,                              // Paid API — not integrated
    webRisk: !!GOOGLE_VISION_KEY,                      // Uses same Google Cloud key
    thornSafer: false,                                 // Requires partnership
  };
}
