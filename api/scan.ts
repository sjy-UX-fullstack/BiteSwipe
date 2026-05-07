import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: any, res: any) {
  // Health check
  if (req.method === 'GET') {
    const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_KEY;
    return res.status(200).json({ status: 'ok', hasKey: !!apiKey });
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

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a professional chef. Look at this image of a fridge or pantry.
Identify all the edible food ingredients visible.
Return ONLY a valid JSON array of strings with ingredient names.
Example: ["eggs", "milk", "tomatoes"]`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType } },
    ]);

    const text = result.response.text();
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');

    if (start !== -1 && end !== -1) {
      const ingredients = JSON.parse(text.substring(start, end + 1));
      return res.status(200).json({ ingredients });
    }
    return res.status(200).json({ ingredients: [] });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[api/scan] error:', msg);
    return res.status(500).json({ error: msg });
  }
}
