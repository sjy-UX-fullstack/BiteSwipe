/**
 * Shopping list — Firestore-backed checklist of ingredients to buy.
 * Stored as a single doc users/{uid}/shoppingList/current with an items[] array
 * to keep reads/writes cheap (one round-trip).
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { getFreshPantry } from './pantry';

export interface ShoppingItem {
  name: string;
  fromRecipe?: string;
  addedAt: number;       // ms epoch
  checked: boolean;
}

function uid(): string | null {
  return auth.currentUser?.uid ?? null;
}

export async function getShoppingList(): Promise<ShoppingItem[]> {
  const u = uid();
  if (!u) return [];
  try {
    const snap = await getDoc(doc(db, 'users', u, 'shoppingList', 'current'));
    if (!snap.exists()) return [];
    const items: ShoppingItem[] = snap.data().items ?? [];
    return items;
  } catch (e) {
    console.warn('[getShoppingList]', e);
    return [];
  }
}

async function writeList(items: ShoppingItem[]): Promise<void> {
  const u = uid();
  if (!u) return;
  await setDoc(
    doc(db, 'users', u, 'shoppingList', 'current'),
    { items, updatedAt: serverTimestamp() },
    { merge: false },
  );
}

/**
 * Adds the listed ingredients to the shopping list. Existing items
 * (case-insensitive name match) keep their checked state.
 */
export async function addItems(names: string[], fromRecipe?: string): Promise<number> {
  const u = uid();
  if (!u) return 0;
  if (names.length === 0) return 0;
  try {
    const existing = await getShoppingList();
    const map = new Map<string, ShoppingItem>();
    for (const item of existing) {
      map.set(item.name.toLowerCase().trim(), item);
    }
    const now = Date.now();
    let added = 0;
    for (const raw of names) {
      const key = raw.toLowerCase().trim();
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, { name: raw.trim(), fromRecipe, addedAt: now, checked: false });
        added++;
      }
    }
    await writeList(Array.from(map.values()));
    return added;
  } catch (e) {
    console.warn('[addItems]', e);
    return 0;
  }
}

export async function setItemChecked(name: string, checked: boolean): Promise<void> {
  try {
    const items = await getShoppingList();
    const next = items.map(it =>
      it.name.toLowerCase().trim() === name.toLowerCase().trim() ? { ...it, checked } : it,
    );
    await writeList(next);
  } catch (e) {
    console.warn('[setItemChecked]', e);
  }
}

export async function removeItem(name: string): Promise<void> {
  try {
    const items = await getShoppingList();
    const next = items.filter(it => it.name.toLowerCase().trim() !== name.toLowerCase().trim());
    await writeList(next);
  } catch (e) {
    console.warn('[removeItem]', e);
  }
}

export async function clearChecked(): Promise<number> {
  try {
    const items = await getShoppingList();
    const remaining = items.filter(it => !it.checked);
    const removed = items.length - remaining.length;
    await writeList(remaining);
    return removed;
  } catch (e) {
    console.warn('[clearChecked]', e);
    return 0;
  }
}

/**
 * Heuristic: from a recipe's ingredient list, returns the names the user
 * likely doesn't have yet — i.e. those NOT covered by the fresh pantry.
 * Uses a substring match so "1 cup chopped onions" is matched by pantry "onion".
 */
export async function missingFromPantry(recipeIngredients: string[]): Promise<string[]> {
  const pantry = await getFreshPantry();
  const pantryLower = pantry.map(p => p.toLowerCase().trim()).filter(Boolean);
  return recipeIngredients.filter(ing => {
    const lo = ing.toLowerCase();
    return !pantryLower.some(p => p && (lo.includes(p) || p.includes(lo.split(' ').slice(-1)[0])));
  });
}
