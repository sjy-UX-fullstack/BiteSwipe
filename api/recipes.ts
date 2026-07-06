export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } },
};

// DeepSeek Chat v3 — cheapest capable JSON-generating model on OpenRouter.
const MODEL = 'deepseek/deepseek-chat';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const APP_TITLE = 'BiteSwipe';
const APP_URL = 'https://biteswipe-five.vercel.app';

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
    const apiKey = process.env.OPENROUTER_API_KEY;
    return res.status(200).json({ status: 'ok', provider: 'openrouter', model: MODEL, hasKey: !!apiKey });
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

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured on server' });
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
      console.error('[api/recipes] openrouter error', r.status, raw);
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
