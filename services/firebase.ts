import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDmoGvnrmb-u_srSeYEBWBYSnjetncpQ4o",
  authDomain: "biteswipe-deb40.firebaseapp.com",
  projectId: "biteswipe-deb40",
  storageBucket: "biteswipe-deb40.firebasestorage.app",
  messagingSenderId: "663641928631",
  appId: "1:663641928631:web:ffccb81dd7563e93f52e32",
  measurementId: "G-NKHVYGZER7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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
