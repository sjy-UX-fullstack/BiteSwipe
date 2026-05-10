/**
 * Search a recipe by dish name. Groq returns ONE detailed recipe in the same
 * shape as /api/recipes (so /ai-recipe can render it with no changes).
 */
export const config = {
  api: { bodyParser: { sizeLimit: '32kb' } },
};

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function buildPrompt(query: string, diet: string, allergens: string[]) {
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
The user wants the recipe for: "${query}"
Diet: ${dietRule}${allergenRule}

If the dish doesn't fit the dietary rule, return the closest variant that does (e.g. paneer biryani instead of chicken biryani for vegetarian).

Return ONLY a single valid JSON object, no prose:
{"id":"search_<slug>","title":"","cuisine":"","cookTime":"","difficulty":"Easy/Medium/Hard","calories":0,"servings":2,"tags":[""],"ingredients":["qty + item"],"steps":["..."]}

Rules for steps (IMPORTANT):
- 5-8 steps, each 2-3 short sentences max
- Always include: heat level (low/medium/high), duration ("3-4 min"), and a visual cue ("until golden", "until fragrant")
- Where spices vary, write the alternative in brackets: "1 tsp cumin [or caraway]", "½ tsp turmeric [or paprika]"
- Example step: "Heat 2 tbsp oil in a pan on medium-high. Add onion and cook 4-5 min until translucent and edges turn golden."`;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', provider: 'groq' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, diet = 'none', allergens = [] } = req.body ?? {};
  if (typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'query (dish name) required' });
  }
  if (query.length > 200) {
    return res.status(400).json({ error: 'query too long' });
  }
  const safeAllergens: string[] = Array.isArray(allergens)
    ? allergens.filter((a: unknown) => typeof a === 'string')
    : [];

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
  }

  try {
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: buildPrompt(query.trim(), diet, safeAllergens) }],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    const raw = await r.text();
    if (!r.ok) {
      console.error('[api/recipe-by-name] groq error', r.status, raw);
      return res.status(r.status).json({ error: `Groq API ${r.status}`, details: raw.slice(0, 500) });
    }

    let data: any;
    try { data = JSON.parse(raw); } catch {
      return res.status(500).json({ error: 'Invalid JSON from Groq' });
    }
    const text: string = data?.choices?.[0]?.message?.content ?? '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      return res.status(200).json({ recipe: null, rawText: text.slice(0, 400) });
    }
    try {
      const recipe = JSON.parse(text.substring(start, end + 1));
      if (!recipe.id) recipe.id = `search_${slugify(query)}`;
      return res.status(200).json({ recipe });
    } catch (e: any) {
      return res.status(200).json({ recipe: null, parseError: e?.message, rawText: text.slice(0, 400) });
    }
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[api/recipe-by-name] fetch error:', msg);
    return res.status(500).json({ error: `Network: ${msg}` });
  }
}
