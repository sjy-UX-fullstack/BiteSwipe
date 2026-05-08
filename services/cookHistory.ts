/**
 * Cook history — logs every successful cook-mode finish.
 * Lives at users/{uid}/cookHistory/{auto-id}.
 */
import {
  collection, addDoc, getDocs, getCountFromServer,
  serverTimestamp, orderBy, query, limit,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface CookEntry {
  id?: string;
  recipeId?: string;
  title: string;
  source: 'ai' | 'mock' | 'trending';
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
    const q = query(
      collection(db, 'users', u, 'cookHistory'),
      orderBy('cookedAt', 'desc'),
      limit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as CookEntry), id: d.id }));
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
