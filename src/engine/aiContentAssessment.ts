/**
 * AI Content Assessment — generates safety ratings using Google Gemini.
 * Triggered automatically when no curated or community rating exists.
 */

export interface AIAssessment {
  creatorName: string;
  summary: string;
  ageRecommendation: number;
  risk: 'safe' | 'caution' | 'not_recommended';
  themes: string[];
  parentAdvice: string;
}

const GEMINI_KEY = process.env.GOOGLE_VISION_API_KEY || '';

export async function getAIAssessment(name: string): Promise<AIAssessment | null> {
  if (!GEMINI_KEY) return null;

  try {
    const prompt = `You are a child safety expert. Assess "${name}" for child safety. This could be a YouTube creator, TikTok personality, TV show, movie, game, or app.

Respond ONLY with valid JSON, no markdown:
{"summary":"2-3 sentence assessment","ageRecommendation":12,"risk":"safe|caution|not_recommended","themes":["theme1","theme2"],"parentAdvice":"One practical sentence"}

Valid themes: violence, profanity, sexual, body-image, gambling, drugs, bullying, positive, educational, creativity. Be concise.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const json = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

    return {
      creatorName: name,
      summary: json.summary || 'Unable to assess.',
      ageRecommendation: json.ageRecommendation || 13,
      risk: json.risk || 'caution',
      themes: json.themes || [],
      parentAdvice: json.parentAdvice || 'Research this content before allowing your child access.',
    };
  } catch {
    return null;
  }
}
