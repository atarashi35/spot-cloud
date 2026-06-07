"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";

export type SocioVisibilityLevel = "owner_only" | "same_spot_socios";

export interface StoredUserProfile {
  profileDisplayName?: string;
  avatarUrl?: string;
  bio?: string;
  occupation?: string;
  specialty?: string;
  visibilityLevel?: SocioVisibilityLevel;
}

export async function getUserProfileDoc(uid: string): Promise<StoredUserProfile | null> {
  const snap = await getDoc(doc(getFirestoreDb(), "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  function str(v: unknown): string | undefined {
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  }
  return {
    profileDisplayName: str(data.profileDisplayName),
    avatarUrl: str(data.avatarUrl),
    bio: str(data.bio),
    occupation: str(data.occupation),
    specialty: str(data.specialty),
    visibilityLevel:
      data.visibilityLevel === "same_spot_socios" ? "same_spot_socios" : "owner_only",
  };
}

export async function saveUserProfileDoc(
  uid: string,
  profile: Partial<StoredUserProfile>
): Promise<void> {
  const payload: Record<string, string> = {};
  const fields: (keyof StoredUserProfile)[] = [
    "profileDisplayName", "avatarUrl", "bio", "occupation", "specialty", "visibilityLevel",
  ];
  for (const key of fields) {
    if (profile[key] !== undefined) {
      payload[key] = String(profile[key]).trim();
    }
  }
  await setDoc(doc(getFirestoreDb(), "users", uid), payload, { merge: true });
}
