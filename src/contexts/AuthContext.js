import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, signInWithGoogle, loginWithEmail as firebaseLoginWithEmail } from "../firebase";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
        } else {
          // First login — create user document
          const profile = {
            email: firebaseUser.email,
            displayName:
              firebaseUser.displayName || firebaseUser.email.split("@")[0],
            isAdmin: false,
          };
          await setDoc(userRef, profile);
          setUserProfile(profile);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    await signInWithGoogle();
  };

  const loginWithEmail = async (email, password) => {
    await firebaseLoginWithEmail(email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = userProfile?.isAdmin === true;

  const value = { user, userProfile, isAdmin, loading, login, loginWithEmail, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
