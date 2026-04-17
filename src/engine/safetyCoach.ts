/**
 * Safety Coach — AI-powered guidance for children
 *
 * Child pastes or shares a message they received.
 * Claude analyzes it and provides:
 * 1. Is this safe or concerning?
 * 2. What's happening (in kid-friendly language)
 * 3. What to do right now
 * 4. Suggested responses they can copy
 * 5. Option to tell parent (without showing the message)
 *
 * PRIVACY: The message is sent to Claude API for analysis but NOT stored.
 * Parent is only notified that the child used the safety coach, not what was said.
 */

const CLAUDE_KEY = process.env.EXPO_PUBLIC_CLAUDE_KEY || '';
const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_KEY || '';

export interface CoachResponse {
  risk: 'safe' | 'caution' | 'danger';
  whatIsHappening: string;
  whatToDo: string[];
  suggestedResponses: string[];
  shouldTellParent: boolean;
  encouragement: string;
}

export async function analyzeMessage(message: string): Promise<CoachResponse | null> {
  if (!CLAUDE_KEY && !GROQ_KEY) return null;

  const prompt = `You are a safety coach for children aged 8-16. A child has shared a message they received and wants to know if it's safe and what to do.

The message they received: "${message}"

Analyze this message and respond ONLY with valid JSON (no markdown):
{
  "risk": "safe|caution|danger",
  "whatIsHappening": "1-2 sentences explaining what's happening in simple language a 10-year-old would understand. If it's grooming, explain without scary words. If it's bullying, validate their feelings. If safe, say so.",
  "whatToDo": ["action 1", "action 2", "action 3"],
  "suggestedResponses": ["response they can copy-paste back", "another option", "a third option"],
  "shouldTellParent": true or false,
  "encouragement": "A warm, empowering sentence. Never blame the child. Always affirm they did the right thing by checking."
}

RULES:
- NEVER blame the child
- Use simple language (age 10 reading level)
- suggestedResponses should be things the child can actually say — short, firm, safe
- If danger: first action should always be "Don't respond to this message"
- If caution: help them set boundaries
- If safe: reassure them
- encouragement must always end with "You did the right thing by checking."
- shouldTellParent is true for danger and caution, false for safe`;

  try {
    let text = '';

    if (CLAUDE_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        text = data.content?.[0]?.text || '';
      }
    }

    if (!text && GROQ_KEY) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 500 }),
      });
      if (res.ok) {
        const data = await res.json();
        text = data.choices?.[0]?.message?.content || '';
      }
    }

    if (!text) return null;

    const json = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return json as CoachResponse;
  } catch {
    return null;
  }
}
