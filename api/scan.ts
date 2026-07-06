export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

const PROMPT = `You are a professional chef. Look at this image of a fridge or pantry.
Identify all the edible food ingredients visible.
Return ONLY a valid JSON array of strings with ingredient names. No prose, no markdown fences.
Example: ["eggs", "milk", "tomatoes"]`;

// Qwen 2.5 VL — cheap, capable vision model on OpenRouter.
const MODEL = 'qwen/qwen-2.5-vl-72b-instruct';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const APP_TITLE = 'BiteSwipe';
const APP_URL = 'https://biteswipe-five.vercel.app';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    return res.status(200).json({ status: 'ok', provider: 'openrouter', model: MODEL, hasKey: !!apiKey });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64, mimeType = 'image/jpeg' } = req.body ?? {};
  if (!base64) return res.status(400).json({ error: 'base64 required' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured on server' });
  }

  const body = {
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 512,
  };

  try {
    const r = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': APP_URL,
        'X-Title': APP_TITLE,
      },
      body: JSON.stringify(body),
    });

    const raw = await r.text();
    if (!r.ok) {
      console.error('[api/scan] openrouter error', r.status, raw);
      return res.status(r.status).json({
        error: `OpenRouter API ${r.status}`,
        details: raw.slice(0, 500),
      });
    }

    let data: any;
    try { data = JSON.parse(raw); } catch {
      return res.status(500).json({ error: 'Invalid JSON from OpenRouter', details: raw.slice(0, 300) });
    }

    const text: string = data?.choices?.[0]?.message?.content ?? '';
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      try {
        const ingredients = JSON.parse(text.substring(start, end + 1));
        return res.status(200).json({ ingredients });
      } catch (e: any) {
        return res.status(200).json({ ingredients: [], parseError: e?.message, rawText: text.slice(0, 300) });
      }
    }
    return res.status(200).json({ ingredients: [], rawText: text.slice(0, 300) });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[api/scan] fetch error:', msg);
    return res.status(500).json({ error: `Network: ${msg}` });
  }
}
