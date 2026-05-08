export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
};

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function buildPrompt(ingredients: string[], diet: string, allergens: string[]) {
  const dietRule =
    diet === 'vegan'
      ? 'STRICTLY VEGAN: no meat, fish, eggs, dairy, honey, ghee, butter, paneer, yogurt.'
      : diet === 'veg'
      ? 'STRICTLY VEGETARIAN: no meat, fish, seafood. Dairy and eggs OK.'
      : 'NON-VEGETARIAN: meat, fish, eggs, dairy all fine.';

  const allergenRule = allergens.length > 0
    ? `\nAllergens to AVOID completely: ${allergens.join(', ')}. Substitute or skip ingredients containing them.`
    : '';

  return `You are BiteSwipe AI, a precise home chef.
Available: ${ingredients.join(', ')}
Diet: ${dietRule}${allergenRule}
Always include these pantry basics in every recipe: salt, oil (any), and 2-3 relevant spices from [cumin/caraway, turmeric/paprika, coriander/oregano, garam masala/Italian seasoning, chili/pepper, garlic powder/fresh garlic].

Generate 5 recipes using the available ingredients. Return ONLY a valid JSON array of 5 objects, no prose:
[{"id":"ai_1","title":"","cuisine":"","cookTime":"","difficulty":"Easy/Medium/Hard","calories":0,"servings":2,"tags":[""],"ingredients":["qty + item"],"steps":["..."],"matchPercentage":0}]

Rules for steps (IMPORTANT):
- 5-7 steps per recipe, each step is 2-3 short sentences max
- Always include: heat level (low/medium/high), duration ("3-4 min"), and a visual cue ("until golden", "until fragrant")
- Where spices vary, write the alternative in brackets: "1 tsp cumin [or caraway]", "½ tsp turmeric [or paprika]"
- Example step: "Heat 2 tbsp oil in a pan on medium-high. Add onion and cook 4-5 min until translucent and edges turn golden."

Sort by matchPercentage desc.`;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const apiKey = process.env.GROQ_API_KEY;
    return res.status(200).json({ status: 'ok', provider: 'groq', hasKey: !!apiKey });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ingredients, diet = 'none', allergens = [] } = req.body ?? {};
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'ingredients[] required' });
  }
  const safeAllergens: string[] = Array.isArray(allergens)
    ? allergens.filter((a: unknown) => typeof a === 'string')
    : [];

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
  }

  const body = {
    model: MODEL,
    messages: [
      { role: 'user', content: buildPrompt(ingredients, diet, safeAllergens) },
    ],
    temperature: 0.5,
    max_tokens: 2800,
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
