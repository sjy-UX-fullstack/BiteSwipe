import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateViralRecipes } from './ai';
import { TrendingItem } from '@/constants/mock-data';

const CACHE_KEY = 'viral_recipes_cache';
const CACHE_TIMESTAMP_KEY = 'viral_recipes_timestamp';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function getViralRecipes(): Promise<TrendingItem[]> {
  try {
    const [cachedJson, timestampStr] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEY),
      AsyncStorage.getItem(CACHE_TIMESTAMP_KEY),
    ]);

    const now = Date.now();
    const cacheAge = timestampStr ? now - parseInt(timestampStr, 10) : Infinity;
    const isFresh = cacheAge < SEVEN_DAYS_MS;

    if (cachedJson && isFresh) {
      return JSON.parse(cachedJson);
    }

    // Fetch fresh batch from Gemini
    const fresh = await generateViralRecipes();
    if (fresh.length > 0) {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)),
        AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, String(now)),
      ]);
      return fresh;
    }

    // If Gemini returned nothing, serve stale cache rather than nothing
    if (cachedJson) return JSON.parse(cachedJson);
    return [];
  } catch {
    return [];
  }
}

/** Force-refresh the cache (e.g. pull-to-refresh) */
export async function refreshViralRecipes(): Promise<TrendingItem[]> {
  try {
    await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
    return getViralRecipes();
  } catch {
    return [];
  }
}
