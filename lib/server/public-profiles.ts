import { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { PublicProfile, PublicProfileKind, PublicProfileStatus } from "@/lib/types";

export async function verifyUserToken(header: string | null): Promise<DecodedIdToken> {
  if (!header?.startsWith("Bearer ")) throw new Error("missing_auth");
  return getAdminAuth().verifyIdToken(header.slice(7));
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalText(value: unknown, max: number): string | undefined {
  return text(value, max) || undefined;
}

function mapProfile(uid: string, data: Record<string, unknown>): PublicProfile {
  return {
    uid,
    kind: data.kind === "organization" ? "organization" : "creator",
    name: text(data.name, 80),
    bio: text(data.bio, 1000),
    fields: Array.isArray(data.fields) ? data.fields.map((v) => text(v, 30)).filter(Boolean).slice(0, 10) : [],
    prefecture: optionalText(data.prefecture, 20),
    city: optionalText(data.city, 40),
    avatarUrl: optionalText(data.avatarUrl, 1000),
    websiteUrl: optionalText(data.websiteUrl, 1000),
    instagramUrl: optionalText(data.instagramUrl, 1000),
    status: (["draft", "pending", "approved", "rejected"] as PublicProfileStatus[]).includes(data.status as PublicProfileStatus)
      ? data.status as PublicProfileStatus : "draft",
    reviewNote: optionalText(data.reviewNote, 500),
    submittedAt: optionalText(data.submittedAt, 40),
    reviewedAt: optionalText(data.reviewedAt, 40),
    createdAt: text(data.createdAt, 40),
    updatedAt: text(data.updatedAt, 40),
  };
}

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  const snap = await getAdminDb().doc(`publicProfiles/${uid}`).get();
  return snap.exists ? mapProfile(uid, snap.data() ?? {}) : null;
}

export async function savePublicProfile(uid: string, input: Record<string, unknown>): Promise<PublicProfile> {
  const kind: PublicProfileKind = input.kind === "organization" ? "organization" : "creator";
  const name = text(input.name, 80);
  const bio = text(input.bio, 1000);
  if (!name || !bio) throw new Error("invalid_profile");
  const now = new Date().toISOString();
  const ref = getAdminDb().doc(`publicProfiles/${uid}`);
  const current = await ref.get();
  const payload = {
    kind,
    name,
    bio,
    fields: Array.isArray(input.fields) ? input.fields.map((v) => text(v, 30)).filter(Boolean).slice(0, 10) : [],
    prefecture: optionalText(input.prefecture, 20) ?? "",
    city: optionalText(input.city, 40) ?? "",
    avatarUrl: optionalText(input.avatarUrl, 1000) ?? "",
    websiteUrl: optionalText(input.websiteUrl, 1000) ?? "",
    instagramUrl: optionalText(input.instagramUrl, 1000) ?? "",
    status: "pending" as const,
    submittedAt: now,
    reviewNote: "",
    createdAt: current.exists ? String(current.data()?.createdAt ?? now) : now,
    updatedAt: now,
  };
  await ref.set(payload, { merge: true });
  return mapProfile(uid, payload);
}

export async function listProfilesForReview(): Promise<PublicProfile[]> {
  const snap = await getAdminDb().collection("publicProfiles").orderBy("updatedAt", "desc").get();
  return snap.docs.map((doc) => mapProfile(doc.id, doc.data()));
}

export async function reviewPublicProfile(uid: string, status: "approved" | "rejected", note?: string) {
  await getAdminDb().doc(`publicProfiles/${uid}`).update({
    status,
    reviewNote: text(note, 500),
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
