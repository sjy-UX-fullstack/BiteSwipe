/**
 * Cook history — logs every successful cook-mode finish.
 * Lives at users/{uid}/cookHistory/{auto-id}.
 */
import {
  collection, addDoc, getDocs, getCountFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface CookEntry {
  id?: string;
  recipeId?: string;
  title: string;
  source: 'ai' | 'mock';
  durationSec: number;
  cookedAt?: any;
}

function uid(): string | null {
  return auth.currentUser?.uid ?? null;
}

export async function logCook(entry: Omit<CookEntry, 'cookedAt' | 'id'>): Promise<void> {
  const u = uid();
  if (!u) return;
  try {
    await addDoc(collection(db, 'users', u, 'cookHistory'), {
      ...entry,
      cookedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[logCook]', e);
  }
}

export async function listCookHistory(max = 50): Promise<CookEntry[]> {
  const u = uid();
  if (!u) return [];
  try {
    const snap = await getDocs(collection(db, 'users', u, 'cookHistory'));
    const entries = snap.docs.map(d => ({ ...(d.data() as CookEntry), id: d.id }));
    entries.sort((a: any, b: any) => {
      const at = a.cookedAt?.toMillis?.() ?? 0;
      const bt = b.cookedAt?.toMillis?.() ?? 0;
      return bt - at;
    });
    return entries.slice(0, max);
  } catch (e) {
    console.warn('[listCookHistory]', e);
    return [];
  }
}

export async function countCooked(): Promise<number> {
  const u = uid();
  if (!u) return 0;
  try {
    const snap = await getCountFromServer(collection(db, 'users', u, 'cookHistory'));
    return snap.data().count;
  } catch {
    return 0;
  }
}
