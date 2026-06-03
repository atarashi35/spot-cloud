"use client";

import {
  Timestamp,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { AppNotification } from "@/lib/types";

function mapNotification(id: string, data: Record<string, unknown>): AppNotification {
  const createdAt = data.createdAt instanceof Timestamp
    ? data.createdAt.toDate().toISOString()
    : String(data.createdAt ?? new Date().toISOString());

  return {
    id,
    type: data.type as AppNotification["type"],
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    spotId: String(data.spotId ?? ""),
    spotName: String(data.spotName ?? ""),
    resourceId: typeof data.resourceId === "string" ? data.resourceId : undefined,
    isRead: Boolean(data.isRead),
    createdAt
  };
}

export function subscribeToNotifications(
  uid: string,
  onChange: (notifications: AppNotification[]) => void
) {
  const q = query(
    collection(getFirestoreDb(), "users", uid, "notifications"),
    orderBy("createdAt", "desc"),
    limit(30)
  );

  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => mapNotification(d.id, d.data())));
  });
}

export async function markNotificationRead(uid: string, notifId: string) {
  await updateDoc(
    doc(getFirestoreDb(), "users", uid, "notifications", notifId),
    { isRead: true }
  );
}

export async function markAllNotificationsRead(uid: string, notifIds: string[]) {
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  notifIds.forEach((id) => {
    batch.update(doc(db, "users", uid, "notifications", id), { isRead: true });
  });
  await batch.commit();
}
