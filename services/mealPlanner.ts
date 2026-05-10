/**
 * Weekly meal planner — single Firestore doc at users/{uid}/mealPlan/current.
 * Entries are keyed by date (YYYY-MM-DD) and meal slot (breakfast/lunch/dinner).
 * UI consumes the next 7 days starting today.
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';
export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

export interface PlannedRecipe {
  recipeId: string;
  title: string;
  source: 'ai' | 'mock' | 'saved';
  cookTime?: string;
  image?: string;
}

export type DayPlan = Partial<Record<MealSlot, PlannedRecipe>>;
export type WeekEntries = Record<string, DayPlan>; // key = YYYY-MM-DD

interface MealPlanDoc {
  entries: WeekEntries;
  updatedAt?: any;
}

function uid(): string {
  const u = auth.currentUser?.uid;
  if (!u) throw new Error('Not signed in');
  return u;
}

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns the next `count` days starting from today (incl). */
export function upcomingDays(count = 7): Date[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export async function getWeekPlan(): Promise<WeekEntries> {
  try {
    const snap = await getDoc(doc(db, 'users', uid(), 'mealPlan', 'current'));
    if (!snap.exists()) return {};
    const data = snap.data() as MealPlanDoc;
    return data.entries ?? {};
  } catch (e) {
    console.warn('[getWeekPlan]', e);
    return {};
  }
}

export async function setMeal(date: Date, slot: MealSlot, recipe: PlannedRecipe): Promise<void> {
  const key = dateKey(date);
  // Strip undefined fields (Firestore rejects them).
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(recipe)) if (v !== undefined) clean[k] = v;
  await setDoc(
    doc(db, 'users', uid(), 'mealPlan', 'current'),
    {
      entries: { [key]: { [slot]: clean } },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function clearMeal(date: Date, slot: MealSlot): Promise<void> {
  // Firestore merge can't delete a nested field cleanly without FieldValue.delete().
  // Easier: read, mutate, write the whole entries map.
  const key = dateKey(date);
  const snap = await getDoc(doc(db, 'users', uid(), 'mealPlan', 'current'));
  const entries: WeekEntries = (snap.exists() ? (snap.data() as MealPlanDoc).entries : {}) ?? {};
  if (entries[key]) {
    delete entries[key][slot];
    if (Object.keys(entries[key]).length === 0) delete entries[key];
  }
  await setDoc(
    doc(db, 'users', uid(), 'mealPlan', 'current'),
    { entries, updatedAt: serverTimestamp() },
  );
}
