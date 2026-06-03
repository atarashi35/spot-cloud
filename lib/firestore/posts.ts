"use client";

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { SpotPost } from "@/lib/types";

type SpotPostInput = {
  title: string;
  body: string;
  imageUrl?: string;
  publishDate: string;
  isPublic: boolean;
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

function sortPosts(list: SpotPost[]) {
  return [...list].sort((left, right) => right.publishDate.localeCompare(left.publishDate));
}

function mapPost(spotId: string, id: string, data: Record<string, unknown>): SpotPost {
  return {
    id,
    spotId,
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
    publishDate: String(data.publishDate ?? ""),
    isPublic: Boolean(data.isPublic),
    createdBy: String(data.createdBy ?? ""),
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt)
  };
}

export async function listSpotPostsFromFirestore(spotId: string, opts?: { publicOnly?: boolean }) {
  const col = collection(getFirestoreDb(), "spots", spotId, "posts");
  const q = opts?.publicOnly
    ? query(col, where("isPublic", "==", true))
    : col;
  const snapshot = await getDocs(q);
  return sortPosts(snapshot.docs.map((item) => mapPost(spotId, item.id, item.data())));
}

export async function getSpotPostFromFirestore(spotId: string, postId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), "spots", spotId, "posts", postId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapPost(spotId, snapshot.id, snapshot.data());
}

export async function createSpotPostInFirestore(
  spotId: string,
  uid: string,
  input: SpotPostInput
) {
  await addDoc(collection(getFirestoreDb(), "spots", spotId, "posts"), {
    title: input.title,
    body: input.body,
    imageUrl: input.imageUrl ?? "",
    publishDate: input.publishDate,
    isPublic: input.isPublic,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateSpotPostInFirestore(
  spotId: string,
  postId: string,
  input: SpotPostInput
) {
  const { updateDoc } = await import("firebase/firestore");
  await updateDoc(doc(getFirestoreDb(), "spots", spotId, "posts", postId), {
    title: input.title,
    body: input.body,
    imageUrl: input.imageUrl ?? "",
    publishDate: input.publishDate,
    isPublic: input.isPublic,
    updatedAt: serverTimestamp()
  });
}

export async function deleteSpotPostInFirestore(spotId: string, postId: string) {
  await deleteDoc(doc(getFirestoreDb(), "spots", spotId, "posts", postId));
}
