import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, collection, getDocs,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDmoGvnrmb-u_srSeYEBWBYSnjetncpQ4o",
  authDomain: "biteswipe-deb40.firebaseapp.com",
  projectId: "biteswipe-deb40",
  storageBucket: "biteswipe-deb40.firebasestorage.app",
  messagingSenderId: "663641928631",
  appId: "1:663641928631:web:ffccb81dd7563e93f52e32",
  measurementId: "G-NKHVYGZER7"
};

// Prevent re-initializing on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// On web, use Firestore's IndexedDB-backed cache so reads are instant after
// the first round-trip. Fallback to plain getFirestore if init has already
// happened (e.g. hot reload) since initializeFirestore can only run once.
let dbInstance: ReturnType<typeof getFirestore>;
if (Platform.OS === 'web') {
  try {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    dbInstance = getFirestore(app);
  }
} else {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

// On native, we use initializeAuth with AsyncStorage persistence.
// On web, getAuth() is sufficient and uses localStorage automatically.
let authInstance: ReturnType<typeof getAuth>;

if (Platform.OS !== 'web') {
  // Lazy import to avoid crashing on web
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  // Only initialize once
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized
    authInstance = getAuth(app);
  }
} else {
  authInstance = getAuth(app);
}

export const auth = authInstance;

// Helper to interact with DB
export const fetchRecipesFromFirebase = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "recipes"));
    const recipes: any[] = [];
    querySnapshot.forEach((doc) => {
      recipes.push({ id: doc.id, ...doc.data() });
    });
    return recipes;
  } catch (e) {
    console.error("Error fetching recipes: ", e);
    return [];
  }
}
