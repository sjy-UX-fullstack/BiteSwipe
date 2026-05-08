/**
 * Pantry memory — remembers ingredients scanned in the last 7 days.
 * Stored as a single doc users/{uid}/pantry/current with an array of {name, scannedAt}.
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface PantryItem {
  name: string;
  scannedAt: number;   // ms epoch
}

function uid(): string | null {
  return auth.currentUser?.uid ?? null;
}

export async function getFreshPantry(): Promise<string[]> {
  const u = uid();
  if (!u) return [];
  try {
    const snap = await getDoc(doc(db, 'users', u, 'pantry', 'current'));
    if (!snap.exists()) return [];
    const items: PantryItem[] = snap.data().items ?? [];
    const cutoff = Date.now() - TTL_MS;
    return items
      .filter(i => typeof i.scannedAt === 'number' && i.scannedAt >= cutoff)
      .map(i => i.name);
  } catch (e) {
    console.warn('[getFreshPantry]', e);
    return [];
  }
}

/**
 * Merge new ingredients with the existing pantry, refreshing scannedAt
 * for duplicates so they keep their TTL alive.
 */
export async function mergePantry(newIngredients: string[]): Promise<void> {
  const u = uid();
  if (!u) return;
  if (newIngredients.length === 0) return;

  try {
    const ref = doc(db, 'users', u, 'pantry', 'current');
    const snap = await getDoc(ref);
    const existing: PantryItem[] = snap.exists() ? (snap.data().items ?? []) : [];

    const now = Date.now();
    const cutoff = now - TTL_MS;

    const map = new Map<string, PantryItem>();
    // keep only fresh existing entries
    for (const item of existing) {
      if (typeof item.scannedAt === 'number' && item.scannedAt >= cutoff) {
        map.set(item.name.toLowerCase().trim(), item);
      }
    }
    // overwrite/add new with current timestamp
    for (const name of newIngredients) {
      const key = name.toLowerCase().trim();
      if (key) map.set(key, { name, scannedAt: now });
    }

    await setDoc(ref, {
      items: Array.from(map.values()),
      updatedAt: serverTimestamp(),
    }, { merge: false });
  } catch (e) {
    console.warn('[mergePantry]', e);
  }
}

export async function clearPantry(): Promise<void> {
  const u = uid();
  if (!u) return;
  try {
    await setDoc(doc(db, 'users', u, 'pantry', 'current'), { items: [], updatedAt: serverTimestamp() });
  } catch (e) {
    console.warn('[clearPantry]', e);
  }
}
