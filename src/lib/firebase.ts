import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize client-side Firebase instance
const app = initializeApp(firebaseConfig);

// Initialize DB referencing specific firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize standard client Authentication
export const auth = getAuth(app);

// Provider instance for Google Sign-In
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, doc, getDoc, setDoc, updateDoc };
