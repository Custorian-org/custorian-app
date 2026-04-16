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

const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_KEY || '';
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || '';
const CLAUDE_KEY = process.env.EXPO_PUBLIC_CLAUDE_KEY || '';

export async function getAIAssessment(name: string): Promise<AIAssessment | null> {
  if (!CLAUDE_KEY && !GROQ_KEY && !GEMINI_KEY) return null;

  try {
    const prompt = `You are a child safety expert. Assess "${name}" for child safety. This could be a YouTube creator, TikTok personality, TV show, movie, game, or app.

Respond ONLY with valid JSON, no markdown:
{"summary":"2-3 sentence assessment","ageRecommendation":12,"risk":"safe|caution|not_recommended","themes":["theme1","theme2"],"parentAdvice":"One practical sentence"}

Valid themes: violence, profanity, sexual, body-image, gambling, drugs, bullying, positive, educational, creativity. Be concise.`;

    let text = '';

    // Claude (primary) — deeper, more nuanced safety assessments
    if (CLAUDE_KEY) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 400,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          text = data.content?.[0]?.text || '';
        }
      } catch {}
    }

    // Groq (fallback) — fast, free
    if (!text && GROQ_KEY) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
          body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 300 }),
        });
        if (res.ok) {
          const data = await res.json();
          text = data.choices?.[0]?.message?.content || '';
        }
      } catch {}
    }

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
