"use client";

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { EventParticipant, SpotEvent } from "@/lib/types";

type SpotEventInput = {
  title: string;
  description: string;
  startAt: string;
  location?: string;
  hasJoinButton: boolean;
};

function parseTimestamp(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

function sortEvents(list: SpotEvent[]) {
  return [...list].sort((left, right) => left.startAt.localeCompare(right.startAt));
}

function mapEvent(spotId: string, id: string, data: Record<string, unknown>): SpotEvent {
  return {
    id,
    spotId,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    startAt: String(data.startAt ?? ""),
    endAt: typeof data.endAt === "string" ? data.endAt : undefined,
    location: typeof data.location === "string" ? data.location : undefined,
    hasJoinButton: Boolean(data.hasJoinButton),
    createdBy: String(data.createdBy ?? ""),
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt)
  };
}

export async function listSpotEventsFromFirestore(spotId: string) {
  const snapshot = await getDocs(collection(getFirestoreDb(), "spots", spotId, "events"));
  return sortEvents(snapshot.docs.map((item) => mapEvent(spotId, item.id, item.data())));
}

export async function getSpotEventFromFirestore(spotId: string, eventId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), "spots", spotId, "events", eventId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapEvent(spotId, snapshot.id, snapshot.data());
}

export async function createSpotEventInFirestore(
  spotId: string,
  uid: string,
  input: SpotEventInput
) {
  await addDoc(collection(getFirestoreDb(), "spots", spotId, "events"), {
    title: input.title,
    description: input.description,
    startAt: input.startAt,
    location: input.location ?? "",
    hasJoinButton: input.hasJoinButton,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateSpotEventInFirestore(
  spotId: string,
  eventId: string,
  input: SpotEventInput
) {
  const { updateDoc } = await import("firebase/firestore");
  await updateDoc(doc(getFirestoreDb(), "spots", spotId, "events", eventId), {
    title: input.title,
    description: input.description,
    startAt: input.startAt,
    location: input.location ?? "",
    hasJoinButton: input.hasJoinButton,
    updatedAt: serverTimestamp()
  });
}

export async function deleteSpotEventInFirestore(spotId: string, eventId: string) {
  await deleteDoc(doc(getFirestoreDb(), "spots", spotId, "events", eventId));
}

function mapParticipant(data: Record<string, unknown>): EventParticipant {
  return {
    uid: String(data.uid ?? ""),
    displayName: typeof data.displayName === "string" ? data.displayName : undefined,
    email: typeof data.email === "string" ? data.email : undefined,
    joinedAt: parseTimestamp(data.joinedAt)
  };
}

export async function listEventParticipantsFromFirestore(spotId: string, eventId: string) {
  const snapshot = await getDocs(collection(getFirestoreDb(), "spots", spotId, "events", eventId, "participants"));
  return snapshot.docs.map((item) => mapParticipant(item.data()));
}

export async function getEventParticipation(spotId: string, eventId: string, uid: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), "spots", spotId, "events", eventId, "participants", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return mapParticipant(snapshot.data());
}

export async function joinSpotEventInFirestore(
  spotId: string,
  eventId: string,
  payload: { uid: string; displayName?: string | null; email?: string | null }
) {
  await setParticipantDoc(spotId, eventId, payload.uid, {
    uid: payload.uid,
    displayName: payload.displayName ?? "",
    email: payload.email ?? "",
    joinedAt: serverTimestamp()
  });
}

export async function leaveSpotEventInFirestore(spotId: string, eventId: string, uid: string) {
  await deleteDoc(doc(getFirestoreDb(), "spots", spotId, "events", eventId, "participants", uid));
}

async function setParticipantDoc(
  spotId: string,
  eventId: string,
  uid: string,
  data: {
    uid: string;
    displayName: string;
    email: string;
    joinedAt: ReturnType<typeof serverTimestamp>;
  }
) {
  await setDoc(doc(getFirestoreDb(), "spots", spotId, "events", eventId, "participants", uid), data, {
    merge: true
  });
}
