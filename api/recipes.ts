export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
};

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function buildPrompt(ingredients: string[], diet: string) {
  const dietRule =
    diet === 'vegan'
      ? 'STRICTLY VEGAN: no meat, fish, eggs, dairy, honey, ghee, butter, paneer, yogurt.'
      : diet === 'veg'
      ? 'STRICTLY VEGETARIAN: no meat, fish, or seafood. Dairy and eggs allowed.'
      : 'NON-VEGETARIAN allowed: meat, fish, eggs, and dairy are all fine.';

  return `You are BiteSwipe AI, a creative chef.
Available ingredients: ${ingredients.join(', ')}
Dietary rule: ${dietRule}

Generate 6 delicious recipes that primarily use the available ingredients (you may add common pantry items like salt, oil, spices, water).
Return ONLY a valid JSON array of 6 objects. No prose, no markdown fences. Format:
[
  {
    "id": "ai_1",
    "title": "Recipe name",
    "cuisine": "Indian/Italian/Mexican/etc",
    "cookTime": "25 min",
    "difficulty": "Easy",
    "calories": 420,
    "servings": 2,
    "tags": ["Quick","Healthy"],
    "ingredients": ["1 cup rice","2 eggs","..."],
    "steps": ["step 1","step 2","..."],
    "matchPercentage": 88
  }
]
Sort by best match first. matchPercentage = how much the recipe leans on the available ingredients (0-100).`;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const apiKey = process.env.GROQ_API_KEY;
    return res.status(200).json({ status: 'ok', provider: 'groq', hasKey: !!apiKey });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ingredients, diet = 'none' } = req.body ?? {};
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'ingredients[] required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
  }

  const body = {
    model: MODEL,
    messages: [
      { role: 'user', content: buildPrompt(ingredients, diet) },
    ],
    temperature: 0.6,
    max_tokens: 2400,
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
      console.error('[api/recipes] groq error', r.status, raw);
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
        const recipes = JSON.parse(text.substring(start, end + 1));
        return res.status(200).json({ recipes });
      } catch (e: any) {
        return res.status(200).json({ recipes: [], parseError: e?.message, rawText: text.slice(0, 400) });
      }
    }
    return res.status(200).json({ recipes: [], rawText: text.slice(0, 400) });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[api/recipes] fetch error:', msg);
    return res.status(500).json({ error: `Network: ${msg}` });
  }
}
