import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  browserPopupRedirectResolver,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const db = getFirestore(app);
export const functions = getFunctions(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(
    auth,
    googleProvider,
    browserPopupRedirectResolver
  );
  return result;
};

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

// Cloud Function callables
export const callImportField = (data) =>
  httpsCallable(functions, "importField")(data);
export const callImportResults = (data) =>
  httpsCallable(functions, "importResults")(data);
export const callCalculateStandings = (data) =>
  httpsCallable(functions, "calculateStandings")(data);
export const callCreateParticipant = (data) =>
  httpsCallable(functions, "createParticipant")(data);
