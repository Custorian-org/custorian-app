/**
 * AI Content Assessment — synthesizes safety ratings for any creator/show/game
 * using Google Gemini API when no community or curated rating exists.
 *
 * Privacy: This is an INFORMATIONAL lookup (like a search engine), not message
 * surveillance. The parent is asking "is this safe for my child?" — the query
 * contains the creator name, not the child's data.
 */

const GEMINI_API_KEY = process.env.GOOGLE_VISION_API_KEY || ''; // Reuse Google Cloud key
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface AIAssessment {
  creatorName: string;
  summary: string;
  ageBrackets: {
    '8-10': { risk: 'safe' | 'caution' | 'not_recommended'; reason: string };
    '11-13': { risk: 'safe' | 'caution' | 'not_recommended'; reason: string };
    '14-16': { risk: 'safe' | 'caution' | 'not_recommended'; reason: string };
  };
  themes: string[];
  parentAdvice: string;
  source: 'ai';
  confidence: 'moderate';
}

export async function getAIAssessment(name: string): Promise<AIAssessment | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const prompt = `You are a child safety expert. A parent is asking whether "${name}" is appropriate for their child.

Assess "${name}" (this could be a YouTube creator, TikTok personality, TV show, movie, video game, or app).

Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{
  "summary": "One paragraph summary of what this is and key safety concerns",
  "ageBrackets": {
    "8-10": { "risk": "safe|caution|not_recommended", "reason": "Brief reason" },
    "11-13": { "risk": "safe|caution|not_recommended", "reason": "Brief reason" },
    "14-16": { "risk": "safe|caution|not_recommended", "reason": "Brief reason" }
  },
  "themes": ["list", "of", "relevant", "themes"],
  "parentAdvice": "One sentence of practical advice for the parent"
}

Valid themes: violence, profanity, sexual, body-image, gambling, drugs, bullying, positive, educational, creativity, empathy, humor, radicalization, predator-risk

Be honest and evidence-based. If you don't know enough about this topic, say so in the summary.`;

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // Parse the JSON response — handle potential markdown wrapping
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      creatorName: name,
      summary: parsed.summary || 'No assessment available.',
      ageBrackets: parsed.ageBrackets || {
        '8-10': { risk: 'caution', reason: 'Insufficient data' },
        '11-13': { risk: 'caution', reason: 'Insufficient data' },
        '14-16': { risk: 'caution', reason: 'Insufficient data' },
      },
      themes: parsed.themes || [],
      parentAdvice: parsed.parentAdvice || 'Research this content before allowing your child to engage with it.',
      source: 'ai',
      confidence: 'moderate',
    };
  } catch {
    return null;
  }
}
