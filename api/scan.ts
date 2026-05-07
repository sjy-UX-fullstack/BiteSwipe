export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

const PROMPT = `You are a professional chef. Look at this image of a fridge or pantry.
Identify all the edible food ingredients visible.
Return ONLY a valid JSON array of strings with ingredient names.
Example: ["eggs", "milk", "tomatoes"]`;

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_KEY;
    return res.status(200).json({ status: 'ok', hasKey: !!apiKey, keyLen: apiKey?.length ?? 0 });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64, mimeType = 'image/jpeg' } = req.body ?? {};
  if (!base64) return res.status(400).json({ error: 'base64 required' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inlineData: { mimeType, data: base64 } },
      ],
    }],
  };

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const raw = await r.text();
    if (!r.ok) {
      console.error('[api/scan] google error', r.status, raw);
      return res.status(r.status).json({
        error: `Gemini API ${r.status}`,
        details: raw.slice(0, 500),
      });
    }

    let data: any;
    try { data = JSON.parse(raw); } catch {
      return res.status(500).json({ error: 'Invalid JSON from Gemini', details: raw.slice(0, 300) });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      try {
        const ingredients = JSON.parse(text.substring(start, end + 1));
        return res.status(200).json({ ingredients });
      } catch (e: any) {
        return res.status(200).json({ ingredients: [], parseError: e?.message });
      }
    }
    return res.status(200).json({ ingredients: [], rawText: text.slice(0, 300) });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[api/scan] fetch error:', msg);
    return res.status(500).json({ error: `Network: ${msg}` });
  }
}
