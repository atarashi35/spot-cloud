"use client";

import { Timestamp, collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import type { UserFollow } from "@/lib/types";

function toIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function mapFollow(spotId: string, data: Record<string, unknown>): UserFollow {
  return {
    spotId,
    spotName: String(data.spotName ?? ""),
    followedAt: toIso(data.followedAt),
  };
}

export async function getUserFollow(uid: string, spotId: string) {
  const snap = await getDoc(doc(getFirestoreDb(), "users", uid, "follows", spotId));
  return snap.exists() ? mapFollow(spotId, snap.data()) : null;
}

export async function listUserFollows(uid: string) {
  const snap = await getDocs(collection(getFirestoreDb(), "users", uid, "follows"));
  return snap.docs
    .map((item) => mapFollow(item.id, item.data()))
    .sort((a, b) => b.followedAt.localeCompare(a.followedAt));
}
