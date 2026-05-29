"use client";

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { UserMembership } from "@/lib/types";

function parseTimestamp(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

function mapMembership(spotId: string, data: Record<string, unknown>): UserMembership {
  return {
    spotId,
    spotName: String(data.spotName ?? ""),
    planAmount: Number(data.planAmount ?? 500) as UserMembership["planAmount"],
    status: (data.status as UserMembership["status"]) ?? "active",
    joinedAt: parseTimestamp(data.joinedAt)
  };
}

export async function getUserMembership(uid: string, spotId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), "users", uid, "memberships", spotId));
  return snapshot.exists() ? mapMembership(spotId, snapshot.data()) : null;
}

export async function listUserMemberships(uid: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), "users", uid, "memberships")));
  return snapshot.docs
    .map((item) => mapMembership(item.id, item.data()))
    .sort((left, right) => right.joinedAt.localeCompare(left.joinedAt));
}
