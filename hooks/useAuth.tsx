import { useState, useEffect, createContext, useContext } from 'react';
import {
  onAuthStateChanged,
  updateProfile,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { Platform } from 'react-native';

const WEB_CLIENT_ID = "663641928631-b0dj4mj6ioqk0hj2r57q32355mg8kiqe.apps.googleusercontent.com";

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout fallback: if Firebase doesn't respond in 5s, unblock the app
    const timeout = setTimeout(() => setLoading(false), 5000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeout);
      setUser(currentUser);
      setLoading(false);
    }, () => {
      // Auth error (e.g. network) — unblock and show login
      clearTimeout(timeout);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUp = async (email: string, pass: string, displayName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const trimmed = displayName?.trim();
    if (trimmed && cred.user) {
      try {
        await updateProfile(cred.user, { displayName: trimmed });
      } catch (e) {
        console.warn('[signUp] updateProfile failed', e);
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // Only call native Google Sign-Out on native platforms
    if (Platform.OS !== 'web') {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.signOut();
    }
  };

  const signInWithGoogle = async () => {
    if (Platform.OS === 'web') {
      // ── Web: use Firebase popup flow ──────────────────────────────
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } else {
      // ── Native (Android/iOS): use native Google Sign-In SDK ───────
      const { GoogleSignin, isSuccessResponse } = require('@react-native-google-signin/google-signin');

      GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        const { idToken } = response.data;
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } else {
        console.log("Google Sign-In cancelled");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
