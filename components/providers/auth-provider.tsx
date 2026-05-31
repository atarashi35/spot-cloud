"use client";

import {
  GoogleAuthProvider,
  User,
  linkWithPopup,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "firebase/auth";
import {
  ReactNode,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState
} from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";

type AuthContextValue = {
  authReady: boolean;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      startTransition(() => {
        setUser(nextUser);
        setAuthReady(true);
      });
    });

    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    authReady,
    user,
    async signInWithGoogle() {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();

      if (auth.currentUser?.isAnonymous) {
        await linkWithPopup(auth.currentUser, provider);
        return;
      }

      await signInWithPopup(auth, provider);
    },
    async signOutUser() {
      await signOut(getFirebaseAuth());
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
