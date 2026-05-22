const Groq = require('groq-sdk');

const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const FALLBACK_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
const MAX_SMS_CHARS = 155;

function truncateSms(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= MAX_SMS_CHARS) return t;
  return `${t.slice(0, MAX_SMS_CHARS - 1)}…`;
}

function uniqueModels() {
  const primary = String(process.env.GROQ_MODEL || '').trim();
  const chain = [];
  if (primary) chain.push(primary);
  for (const m of FALLBACK_MODELS) {
    if (!chain.includes(m)) chain.push(m);
  }
  if (!chain.includes(DEFAULT_MODEL)) chain.push(DEFAULT_MODEL);
  return chain;
}

/**
 * @param {{ message: string; type?: string; rating?: number; category?: string; name?: string }} feedback
 * @param {string} model
 */
async function generateWithModel(feedback, model) {
  const apiKey = String(process.env.GROQ_API_KEY ?? '').trim();
  if (!apiKey) throw new Error('Missing GROQ_API_KEY');

  const brand = process.env.AI_BRAND_NAME || 'our restaurant';
  const groq = new Groq({ apiKey });
  const userBlock = [
    `Customer name: ${feedback.name || 'Guest'}`,
    `Feedback type: ${feedback.type || 'unknown'}`,
    `Category: ${feedback.category || 'General'}`,
    `Rating (1-5): ${feedback.rating ?? 'n/a'}`,
    `Message: ${feedback.message}`,
  ].join('\n');

  const completion = await groq.chat.completions.create({
    model,
    max_tokens: 180,
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: `You are the SMS assistant for ${brand}. Write ONE SMS reply to the customer based on their feedback.
Rules:
- Under ${MAX_SMS_CHARS} characters total (strict).
- Professional, warm, no markdown, no quotes, no emojis unless one fits naturally.
- If the feedback is a complaint or very low rating: apologize briefly and say a team member will follow up (do not promise a specific time).
- If compliment: thank them sincerely.
- If suggestion: thank them and say we will consider it.
Output ONLY the SMS body text, nothing else.`,
      },
      { role: 'user', content: userBlock },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty AI response');
  return truncateSms(raw.replace(/^["']|["']$/g, ''));
}

/**
 * Generate a short customer-facing SMS from feedback context (Groq).
 * Tries primary model then fallbacks if the model ID is wrong or unavailable.
 */
async function generateSmsReply(feedback) {
  let lastErr;
  for (const model of uniqueModels()) {
    try {
      return await generateWithModel(feedback, model);
    } catch (e) {
      lastErr = e;
      console.error('[auto-ai-sms] Groq model failed:', model, e?.message || e);
    }
  }
  throw lastErr || new Error('All Groq models failed');
}

module.exports = { generateSmsReply, truncateSms };
