/**
 * Saved recipes — Firestore-backed bookmarks at users/{uid}/saved/{recipeId}.
 * Stores the full recipe payload because AI-generated recipes don't live anywhere else.
 */
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export type SavedSource = 'ai' | 'mock' | 'trending';

export interface SavedRecipe {
  id: string;
  title: string;
  cuisine?: string;
  cookTime?: string;
  difficulty?: string;
  calories?: number;
  servings?: number;
  ingredients?: string[];
  steps?: string[];
  tags?: string[];
  matchPercentage?: number;
  source: SavedSource;
  image?: string;          // for mock/trending image URLs (mock recipes use require'd assets — skip then)
  savedAt?: any;
}

function uid(): string {
  const u = auth.currentUser?.uid;
  if (!u) throw new Error('Not signed in');
  return u;
}

export async function saveRecipe(recipe: SavedRecipe): Promise<void> {
  // Firestore rejects undefined values — strip them.
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(recipe)) {
    if (v !== undefined) clean[k] = v;
  }
  await setDoc(
    doc(db, 'users', uid(), 'saved', recipe.id),
    { ...clean, savedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function unsaveRecipe(recipeId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid(), 'saved', recipeId));
}

export async function isRecipeSaved(recipeId: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'users', uid(), 'saved', recipeId));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function listSavedRecipes(max = 100): Promise<SavedRecipe[]> {
  try {
    const snap = await getDocs(collection(db, 'users', uid(), 'saved'));
    const recipes = snap.docs.map(d => ({ ...(d.data() as SavedRecipe), id: d.id }));
    // Sort newest-first client-side; tolerate missing savedAt on old docs.
    recipes.sort((a, b) => {
      const at = a.savedAt?.toMillis?.() ?? 0;
      const bt = b.savedAt?.toMillis?.() ?? 0;
      return bt - at;
    });
    return recipes.slice(0, max);
  } catch (e) {
    console.warn('[listSavedRecipes]', e);
    return [];
  }
}

export async function countSaved(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'users', uid(), 'saved'));
    return snap.size;
  } catch {
    return 0;
  }
}
