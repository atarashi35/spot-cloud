"use client";

import {
  GoogleAuthProvider,
  MultiFactorError,
  OAuthProvider,
  User,
  linkWithPopup,
  linkWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
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
import { MfaVerificationModal } from "@/components/auth/mfa-verification-modal";
import { ensureUserProfileDoc } from "@/lib/firestore/user-profile";

type AuthContextValue = {
  authReady: boolean;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isMfaError(e: unknown): e is MultiFactorError {
  return (e as { code?: string }).code === "auth/multi-factor-auth-required";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [mfaError, setMfaError] = useState<MultiFactorError | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (nextUser && !nextUser.isAnonymous) {
        const joinedAt = nextUser.metadata.creationTime
          ? new Date(nextUser.metadata.creationTime).toISOString()
          : new Date().toISOString();
        void ensureUserProfileDoc(nextUser.uid, joinedAt);
      }
      startTransition(() => {
        setUser(nextUser);
        setAuthReady(true);
      });
    });

    void getRedirectResult(auth).catch((error: unknown) => {
      if (isMfaError(error)) setMfaError(error);
    });

    return unsubscribe;
  }, []);

  async function signInWithProvider(provider: GoogleAuthProvider | OAuthProvider, useRedirect: boolean) {
    const auth = getFirebaseAuth();

    try {
      if (useRedirect) {
        if (auth.currentUser?.isAnonymous) {
          await linkWithRedirect(auth.currentUser, provider);
          return;
        }
        await signInWithRedirect(auth, provider);
        return;
      }

      if (auth.currentUser?.isAnonymous) {
        await linkWithPopup(auth.currentUser, provider);
        return;
      }
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (isMfaError(error)) {
        setMfaError(error);
        return;
      }
      throw error;
    }
  }

  const value: AuthContextValue = {
    authReady,
    user,
    async signInWithGoogle() {
      const provider = new GoogleAuthProvider();
      await signInWithProvider(provider, false);
    },
    async signInWithApple() {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      await signInWithProvider(provider, false);
    },
    async signOutUser() {
      await signOut(getFirebaseAuth());
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <MfaVerificationModal
        open={mfaError !== null}
        error={mfaError}
        onClose={() => setMfaError(null)}
        onVerified={() => setMfaError(null)}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
