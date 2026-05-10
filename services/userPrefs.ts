/**
 * User preferences — dietary preference + allergens — stored in Firestore at users/{uid}.
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { DietPreference } from './ai';

export const ALLERGEN_OPTIONS = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'nuts', label: 'Tree nuts' },
  { value: 'peanuts', label: 'Peanuts' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'soy', label: 'Soy' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'fish', label: 'Fish' },
] as const;

export type Allergen = typeof ALLERGEN_OPTIONS[number]['value'];

export type CookingFor = 'self' | 'couple' | 'family';

export const COOKING_FOR_OPTIONS: { value: CookingFor; label: string; sub: string; icon: string; defaultServings: number }[] = [
  { value: 'self', label: 'Just me', sub: '1 serving', icon: 'user', defaultServings: 1 },
  { value: 'couple', label: 'Two of us', sub: '2 servings', icon: 'users', defaultServings: 2 },
  { value: 'family', label: 'Family', sub: '4+ servings', icon: 'home', defaultServings: 4 },
];

export interface UserPrefs {
  dietPreference: DietPreference | null;
  allergens: Allergen[];
  cookingFor: CookingFor | null;
  onboardingComplete: boolean;
}

const DEFAULT_PREFS: UserPrefs = {
  dietPreference: null,
  allergens: [],
  cookingFor: null,
  onboardingComplete: false,
};

export async function getPrefs(): Promise<UserPrefs> {
  const uid = auth.currentUser?.uid;
  if (!uid) return DEFAULT_PREFS;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return DEFAULT_PREFS;
    const data = snap.data() as Partial<UserPrefs>;
    return {
      dietPreference: data.dietPreference ?? null,
      allergens: Array.isArray(data.allergens) ? data.allergens : [],
      cookingFor: data.cookingFor ?? null,
      onboardingComplete: !!data.onboardingComplete,
    };
  } catch (e) {
    console.warn('[getPrefs]', e);
    return DEFAULT_PREFS;
  }
}

export async function savePrefs(prefs: Partial<UserPrefs>): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  await setDoc(
    doc(db, 'users', uid),
    { ...prefs, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
