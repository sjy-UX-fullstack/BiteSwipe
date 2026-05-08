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
): Promise<AIRecipe[]> => {
  const url = Platform.OS === 'web'
    ? '/api/recipes'
    : 'https://biteswipe-five.vercel.app/api/recipes';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients, diet }),
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
 * Asks Gemini to generate a full recipe from a title or URL text.
 * NOTE: Gemini cannot browse URLs — pass text/title only.
 */
export const parseRecipeText = async (textToParse: string): Promise<any> => {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const prompt = `Extract or generate recipe information from this text or title.
Return ONLY valid JSON in this exact format:
{"title":"Recipe Name","ingredients":["ing1","ing2"],"steps":["step1","step2"],"calories":400,"cookTime":"20 min","difficulty":"Medium","cuisine":"Italian"}
Text: ${textToParse}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(text.substring(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Generates a batch of trending recipe ideas for the week.
 * Used by the weekly viral recipe pull service.
 */
export const generateViralRecipes = async (): Promise<any[]> => {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const prompt = `You are a food trend analyst. Generate 6 viral, trending recipe ideas for ${currentMonth} that are popular on Instagram Reels and YouTube Shorts in India and globally.
Return ONLY a valid JSON array with exactly 6 objects in this format:
[
  {
    "id": "viral_1",
    "title": "Recipe Title",
    "cuisine": "Indian/Italian/etc",
    "cookTime": "25 min",
    "difficulty": "Easy",
    "calories": 450,
    "servings": 2,
    "source": "instagram",
    "creator": "@creatorname",
    "views": "4.2M",
    "icon": "zap",
    "tags": ["Trending", "Quick"],
    "ingredients": ["ing1", "ing2", "ing3"],
    "steps": ["step1", "step2", "step3"],
    "matchPercentage": 82
  }
]
Make them genuinely exciting, globally trending but cook-friendly. Mix indian and global cuisine.`;

  const result = await model.generateContent(prompt);
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
