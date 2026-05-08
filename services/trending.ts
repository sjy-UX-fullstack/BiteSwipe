/**
 * Reads weekly-refreshed trending recipes from Firestore (collection
 * `trending_recipes`, populated by /api/cron/refresh-trending).
 * Sorted by viewCount desc client-side; tolerant of missing fields.
 */
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export type TrendingSource = 'youtube' | 'instagram';

export interface TrendingRecipe {
  id: string;
  source: TrendingSource;
  title: string;
  creator?: string;
  channel?: string;
  thumbnail?: string;
  videoId?: string;
  embedUrl?: string;
  originalUrl?: string;
  viewCount?: number;
  publishedAt?: string;
  cuisine?: string | null;
  cookTime?: string | null;
  difficulty?: string | null;
  calories?: number | null;
  servings?: number | null;
  ingredients?: string[];
  steps?: string[];
  tags?: string[];
}

function formatViews(n?: number): string {
  if (!n || n <= 0) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export async function listTrending(): Promise<TrendingRecipe[]> {
  try {
    const snap = await getDocs(collection(db, 'trending_recipes'));
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as TrendingRecipe[];
    items.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    return items;
  } catch (e) {
    console.warn('[listTrending]', e);
    return [];
  }
}

export { formatViews };
