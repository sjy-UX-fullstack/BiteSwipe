export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

const PROMPT = `You are a professional chef. Look at this image of a fridge or pantry.
Identify all the edible food ingredients visible.
Return ONLY a valid JSON array of strings with ingredient names. No prose, no markdown fences.
Example: ["eggs", "milk", "tomatoes"]`;

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const apiKey = process.env.GROQ_API_KEY;
    return res.status(200).json({ status: 'ok', provider: 'groq', hasKey: !!apiKey, keyLen: apiKey?.length ?? 0 });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64, mimeType = 'image/jpeg' } = req.body ?? {};
  if (!base64) return res.status(400).json({ error: 'base64 required' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
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
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const raw = await r.text();
    if (!r.ok) {
      console.error('[api/scan] groq error', r.status, raw);
      return res.status(r.status).json({
        error: `Groq API ${r.status}`,
        details: raw.slice(0, 500),
      });
    }

    let data: any;
    try { data = JSON.parse(raw); } catch {
      return res.status(500).json({ error: 'Invalid JSON from Groq', details: raw.slice(0, 300) });
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
