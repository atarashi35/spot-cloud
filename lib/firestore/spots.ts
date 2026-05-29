"use client";

import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { Spot, SpotCategory } from "@/lib/types";
import { prefecturePattern, slugify, splitAddress, toShortDescription } from "@/lib/utils";

type SpotInput = {
  name: string;
  description: string;
  category: SpotCategory;
  address: string;
  prefecture: string;
  city: string;
  coverImageUrl?: string;
  isPublished: boolean;
};

const tonePalette = [
  "from-stone-300 via-sand to-emerald-100",
  "from-orange-100 via-amber-50 to-stone-100",
  "from-cyan-100 via-white to-sky-50",
  "from-lime-100 via-stone-50 to-emerald-50"
] as const;

function parseTimestamp(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

function mapFirestoreSpot(id: string, data: Record<string, unknown>): Spot {
  const description = String(data.description ?? "");
  const address = String(data.address ?? "");
  const derivedArea = splitAddress(address);
  const rawPrefecture = String(data.prefecture ?? "");
  const rawCity = String(data.city ?? "");
  const prefecture =
    rawPrefecture && prefecturePattern.test(rawPrefecture) ? rawPrefecture.match(prefecturePattern)?.[0] ?? rawPrefecture : derivedArea.prefecture;
  const city =
    rawCity && rawCity !== rawPrefecture && rawCity.length <= 20 ? rawCity : derivedArea.city;

  return {
    id,
    name: String(data.name ?? ""),
    description,
    shortDescription: String(data.shortDescription ?? toShortDescription(description)),
    category: (data.category as SpotCategory) ?? "その他",
    address,
    prefecture,
    city,
    coverImageUrl: typeof data.coverImageUrl === "string" ? data.coverImageUrl : undefined,
    coverTone:
      typeof data.coverTone === "string" ? data.coverTone : tonePalette[id.length % tonePalette.length],
    ownerUid: String(data.ownerUid ?? ""),
    stripeConnectedAccountId:
      typeof data.stripeConnectedAccountId === "string" ? data.stripeConnectedAccountId : undefined,
    socioCount: Number(data.socioCount ?? 0),
    isPublished: Boolean(data.isPublished),
    isSuspended: Boolean(data.isSuspended),
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt)
  };
}

function sortSpots(list: Spot[]) {
  return [...list].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function listPublishedSpotsFromFirestore() {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), "spots"), where("isPublished", "==", true)));
  return sortSpots(snapshot.docs.map((item) => mapFirestoreSpot(item.id, item.data())).filter((spot) => !spot.isSuspended));
}

export async function listOwnerSpotsFromFirestore(uid: string) {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), "spots"), where("ownerUid", "==", uid)));

  return sortSpots(snapshot.docs.map((item) => mapFirestoreSpot(item.id, item.data())));
}

export async function getSpotFromFirestore(spotId: string) {
  const snapshot = await getDoc(doc(getFirestoreDb(), "spots", spotId));
  return snapshot.exists() ? mapFirestoreSpot(snapshot.id, snapshot.data()) : null;
}

export async function createSpotInFirestore(input: SpotInput, ownerUid: string) {
  const toneSeed = slugify(input.name)
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const coverTone = tonePalette[toneSeed % tonePalette.length];

  const ref = await addDoc(collection(getFirestoreDb(), "spots"), {
    name: input.name,
    description: input.description,
    shortDescription: toShortDescription(input.description),
    category: input.category,
    address: input.address,
    prefecture: input.prefecture,
    city: input.city,
    coverTone,
    coverImageUrl: input.coverImageUrl ?? "",
    ownerUid,
    socioCount: 0,
    isPublished: input.isPublished,
    isSuspended: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return ref.id;
}

export async function updateSpotInFirestore(spotId: string, input: SpotInput) {
  await updateDoc(doc(getFirestoreDb(), "spots", spotId), {
    name: input.name,
    description: input.description,
    shortDescription: toShortDescription(input.description),
    category: input.category,
    address: input.address,
    prefecture: input.prefecture,
    city: input.city,
    coverImageUrl: input.coverImageUrl ?? "",
    isPublished: input.isPublished,
    updatedAt: serverTimestamp()
  });
}
