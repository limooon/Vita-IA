import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  type User,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize client-side Firebase instance
const app = initializeApp(firebaseConfig);

// Initialize DB (uses default database — no custom firestoreDatabaseId)
export const db = getFirestore(app);

// Initialize standard client Authentication
export const auth = getAuth(app);

// Set persistence to LOCAL so the session survives page reloads (required for redirect flow)
setPersistence(auth, browserLocalPersistence).catch((err) =>
  console.warn("Failed to set auth persistence:", err)
);

// Provider instance for Google Sign-In
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
googleProvider.addScope("profile");
googleProvider.addScope("email");

// Re-export all needed auth functions
export {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  doc,
  getDoc,
  setDoc,
  updateDoc,
};
export type { User };
