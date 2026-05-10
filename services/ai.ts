import { GoogleGenerativeAI } from "@google/generative-ai";
import { Platform } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY ?? '';
const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL = "gemini-2.5-flash";

/**
 * Sends a base64 encoded image to Gemini to extract ingredients.
 * On web: proxied through /api/scan to avoid CORS / geo-blocking.
 * On native: calls Gemini directly.
 */
export const scanFridge = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<string[]> => {
  if (Platform.OS === 'web') {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64: base64Image, mimeType }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail = body.details ? ` — ${body.details}` : '';
      throw new Error((body.error ?? `Server error ${res.status}`) + detail);
    }
    const data = await res.json();
    return data.ingredients ?? [];
  }

  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `You are a professional chef. Look at this image of a fridge or pantry.
Identify all the edible food ingredients visible.
Return ONLY a valid JSON array of strings containing the ingredient names.
Example: ["eggs", "milk", "tomatoes"]`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image, mimeType } },
  ]);

  const text = result.response.text();
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(text.substring(start, end + 1));
    } catch {
      return [];
    }
  }
  return [];
};

export type DietPreference = 'veg' | 'non-veg' | 'vegan';

export interface AIRecipe {
  id: string;
  title: string;
  cuisine: string;
  cookTime: string;
  difficulty: string;
  calories: number;
  servings: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
  matchPercentage: number;
}

/**
 * Generates recipes from a list of ingredients honoring dietary preference.
 * Always proxied through /api/recipes (works on web; native fetches the same endpoint
 * via absolute URL once deployed). Falls back gracefully if the host is unreachable.
 */
export const generateRecipesFromIngredients = async (
  ingredients: string[],
  diet: DietPreference,
  allergens: string[] = [],
): Promise<AIRecipe[]> => {
  const url = Platform.OS === 'web'
    ? '/api/recipes'
    : 'https://biteswipe-five.vercel.app/api/recipes';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients, diet, allergens }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.details ? ` — ${body.details}` : '';
    throw new Error((body.error ?? `Server error ${res.status}`) + detail);
  }
  const data = await res.json();
  return data.recipes ?? [];
};

/**
 * Search by dish name → returns one detailed recipe (same shape as AIRecipe minus matchPercentage).
 * Powered by Groq via /api/recipe-by-name.
 */
export const searchRecipeByName = async (
  query: string,
  diet: DietPreference = 'non-veg',
  allergens: string[] = [],
): Promise<AIRecipe | null> => {
  const url = Platform.OS === 'web'
    ? '/api/recipe-by-name'
    : 'https://biteswipe-five.vercel.app/api/recipe-by-name';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, diet, allergens }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.details ? ` — ${body.details}` : '';
    throw new Error((body.error ?? `Server error ${res.status}`) + detail);
  }
  const data = await res.json();
  return data.recipe ?? null;
};

