import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

export const db = getFirestore(app);

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
