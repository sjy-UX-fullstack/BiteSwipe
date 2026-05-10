/**
 * "For You" feed aggregator — pure helpers that derive personalized
 * recommendations from existing services (no new Firestore collections).
 *
 *  - Cook Again         → dedup recent cookHistory
 *  - From Your Fridge   → /api/recipes called with current pantry; cached daily
 *  - Cuisines You Love  → cuisine counts from saved recipes
 *  - Try Something New  → curated dish list filtered by cuisine
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listCookHistory, type CookEntry } from './cookHistory';
import { listSavedRecipes, type SavedRecipe } from './savedRecipes';
import { getFreshPantry } from './pantry';
import { getPrefs } from './userPrefs';
import { generateRecipesFromIngredients, type AIRecipe } from './ai';

const PANTRY_CACHE_KEY = 'forYou_pantryRecipes_v1';
const MIN_PANTRY_FOR_RECIPES = 4;

/* ─── Cook Again ─────────────────────────────────────────────────── */

export interface CookAgainItem {
  recipeId?: string;
  title: string;
  source: 'ai' | 'mock';
  lastCookedMs?: number;
}

export async function getCookAgainPicks(max = 5): Promise<CookAgainItem[]> {
  const history = await listCookHistory(50);
  const seen = new Set<string>();
  const out: CookAgainItem[] = [];
  for (const h of history) {
    const key = (h.recipeId ?? h.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      recipeId: h.recipeId,
      title: h.title,
      source: h.source,
      lastCookedMs: (h as any).cookedAt?.toMillis?.() ?? 0,
    });
    if (out.length >= max) break;
  }
  return out;
}

/* ─── Cuisines You Love ──────────────────────────────────────────── */

export interface CuisineCount {
  cuisine: string;
  count: number;
}

export async function getCuisineAffinity(max = 4): Promise<CuisineCount[]> {
  const saved = await listSavedRecipes(200);
  const counts = new Map<string, number>();
  for (const r of saved) {
    const c = (r.cuisine ?? '').trim();
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([cuisine, count]) => ({ cuisine, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, max);
}

/* ─── Try Something New (curated, client-side) ───────────────────── */

export const CURATED_DISHES_BY_CUISINE: Record<string, string[]> = {
  Indian: ['Butter Chicken', 'Palak Paneer', 'Chicken Biryani', 'Masala Dosa', 'Chole Bhature', 'Rajma Chawal'],
  Italian: ['Pasta Carbonara', 'Margherita Pizza', 'Mushroom Risotto', 'Lasagna', 'Pesto Pasta', 'Eggplant Parmigiana'],
  Chinese: ['Kung Pao Chicken', 'Mapo Tofu', 'Hakka Noodles', 'Chilli Paneer', 'Schezwan Fried Rice'],
  Mexican: ['Chicken Tacos', 'Quesadilla', 'Burrito Bowl', 'Enchiladas', 'Guacamole'],
  Thai: ['Pad Thai', 'Green Curry', 'Tom Yum Soup', 'Massaman Curry', 'Mango Sticky Rice'],
  Japanese: ['Teriyaki Chicken', 'Miso Ramen', 'Sushi Bowl', 'Katsu Curry', 'Tempura'],
  Mediterranean: ['Greek Salad', 'Hummus Bowl', 'Falafel Wrap', 'Shakshuka', 'Tabbouleh'],
  American: ['Smash Burger', 'Mac and Cheese', 'Pulled Pork', 'BBQ Ribs', 'Buffalo Wings'],
  Korean: ['Bibimbap', 'Korean Fried Chicken', 'Kimchi Fried Rice', 'Bulgogi'],
};

export const ALL_CUISINES = Object.keys(CURATED_DISHES_BY_CUISINE);

/** Picks dishes from cuisines the user has affinity for, otherwise a global mix. */
export async function getDiscoveryPicks(perCuisine = 3): Promise<{ cuisine: string; dishes: string[] }[]> {
  const affinity = await getCuisineAffinity(3);
  const picked = affinity.length > 0
    ? affinity.map(a => a.cuisine).filter(c => CURATED_DISHES_BY_CUISINE[c])
    : ['Indian', 'Italian', 'Mexican']; // Sensible default
  if (picked.length === 0) return ALL_CUISINES.slice(0, 3).map(c => ({
    cuisine: c, dishes: (CURATED_DISHES_BY_CUISINE[c] ?? []).slice(0, perCuisine),
  }));
  return picked.map(c => ({
    cuisine: c,
    dishes: (CURATED_DISHES_BY_CUISINE[c] ?? []).slice(0, perCuisine),
  }));
}

/* ─── From Your Fridge (pantry-aware, daily-cached) ──────────────── */

interface PantryCache {
  dateKey: string;       // YYYY-MM-DD
  pantryHash: string;    // sorted-joined ingredient list
  recipes: AIRecipe[];
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function hashPantry(items: string[]): string {
  return items.map(s => s.toLowerCase().trim()).sort().join('|');
}

export interface PantryReadyResult {
  recipes: AIRecipe[];
  pantrySize: number;
  fromCache: boolean;
}

export async function getPantryReadyPicks(force = false): Promise<PantryReadyResult> {
  const pantry = await getFreshPantry();
  if (pantry.length < MIN_PANTRY_FOR_RECIPES) {
    return { recipes: [], pantrySize: pantry.length, fromCache: false };
  }
  const dateKey = todayKey();
  const pantryHash = hashPantry(pantry);

  if (!force) {
    try {
      const raw = await AsyncStorage.getItem(PANTRY_CACHE_KEY);
      if (raw) {
        const cached: PantryCache = JSON.parse(raw);
        if (cached.dateKey === dateKey && cached.pantryHash === pantryHash) {
          return { recipes: cached.recipes ?? [], pantrySize: pantry.length, fromCache: true };
        }
      }
    } catch { /* ignore */ }
  }

  const prefs = await getPrefs();
  try {
    const recipes = await generateRecipesFromIngredients(
      pantry,
      prefs.dietPreference ?? 'non-veg',
      prefs.allergens ?? [],
    );
    const top = recipes.slice(0, 3);
    const cache: PantryCache = { dateKey, pantryHash, recipes: top };
    await AsyncStorage.setItem(PANTRY_CACHE_KEY, JSON.stringify(cache));
    return { recipes: top, pantrySize: pantry.length, fromCache: false };
  } catch (e) {
    console.warn('[getPantryReadyPicks]', e);
    return { recipes: [], pantrySize: pantry.length, fromCache: false };
  }
}
