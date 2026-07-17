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
import { Spot, SpotCategory, SocialLinks, PlanBenefits, TeamMember, normalizeSpotCategory } from "@/lib/types";
import { prefecturePattern, slugify, splitAddress, toShortDescription } from "@/lib/utils";

type SpotInput = {
  name: string;
  description: string;
  category: SpotCategory;
  address: string;
  prefecture: string;
  city: string;
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  isPublished: boolean;
  phone?: string;
  email?: string;
  socialLinks?: SocialLinks;
  planBenefits?: PlanBenefits;
  teamMembers?: TeamMember[];
  performerFee?: number;
  performerFeeNote?: string;
  performerDisciplines?: string[];
  bookingsEnabled?: boolean;
};

const tonePalette = [
  "from-zinc-200 via-stone-100 to-zinc-50",
  "from-zinc-300 via-zinc-100 to-stone-50",
  "from-stone-200 via-zinc-100 to-white",
  "from-neutral-200 via-stone-100 to-zinc-50"
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
    category: normalizeSpotCategory(data.category),
    address,
    prefecture,
    city,
    coverImageUrl: typeof data.coverImageUrl === "string" ? data.coverImageUrl : undefined,
    galleryImageUrls: Array.isArray(data.galleryImageUrls)
      ? (data.galleryImageUrls as string[]).filter((u) => typeof u === "string")
      : [],
    coverTone:
      typeof data.coverTone === "string" ? data.coverTone : tonePalette[id.length % tonePalette.length],
    ownerUid: String(data.ownerUid ?? ""),
    stripeConnectedAccountId:
      typeof data.stripeConnectedAccountId === "string" ? data.stripeConnectedAccountId : undefined,
    socioCount: Number(data.socioCount ?? 0),
    isPublished: Boolean(data.isPublished),
    isSuspended: Boolean(data.isSuspended),
    phone: typeof data.phone === "string" ? data.phone : undefined,
    email: typeof data.email === "string" ? data.email : undefined,
    socialLinks: typeof data.socialLinks === "object" && data.socialLinks
      ? (data.socialLinks as SocialLinks)
      : undefined,
    planBenefits: typeof data.planBenefits === "object" && data.planBenefits
      ? (data.planBenefits as PlanBenefits)
      : undefined,
    opinionBoxEnabled: Boolean(data.opinionBoxEnabled),
    teamMembers: Array.isArray(data.teamMembers)
      ? (data.teamMembers as TeamMember[]).filter((m) => m && typeof m.name === "string")
      : undefined,
    performerFee: typeof data.performerFee === "number" && data.performerFee > 0 ? data.performerFee : undefined,
    performerFeeNote: typeof data.performerFeeNote === "string" && data.performerFeeNote ? data.performerFeeNote : undefined,
    performerDisciplines: Array.isArray(data.performerDisciplines)
      ? (data.performerDisciplines as string[]).filter((d) => typeof d === "string" && d.trim())
      : undefined,
    bookingsEnabled: typeof data.bookingsEnabled === "boolean" ? data.bookingsEnabled : undefined,
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt)
  };
}

function sortSpots(list: Spot[]) {
  return [...list].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function listPublishedSpotsFromFirestore() {
  const snapshot = await getDocs(
    query(collection(getFirestoreDb(), "spots"), where("isPublished", "==", true))
  );
  return sortSpots(
    snapshot.docs
      .map((item) => mapFirestoreSpot(item.id, item.data()))
      .filter((spot) => !spot.isSuspended)
  );
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
    galleryImageUrls: input.galleryImageUrls ?? [],
    ownerUid,
    socioCount: 0,
    isPublished: input.isPublished,
    isSuspended: false,
    phone: input.phone ?? "",
    email: input.email ?? "",
    socialLinks: input.socialLinks ?? {},
    planBenefits: input.planBenefits ?? {},
    teamMembers: input.teamMembers ?? [],
    performerFee: input.performerFee ?? 0,
    performerFeeNote: input.performerFeeNote ?? "",
    performerDisciplines: input.performerDisciplines ?? [],
    bookingsEnabled: input.bookingsEnabled ?? true,
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
    galleryImageUrls: input.galleryImageUrls ?? [],
    isPublished: input.isPublished,
    phone: input.phone ?? "",
    email: input.email ?? "",
    socialLinks: input.socialLinks ?? {},
    planBenefits: input.planBenefits ?? {},
    teamMembers: input.teamMembers ?? [],
    performerFee: input.performerFee ?? 0,
    performerFeeNote: input.performerFeeNote ?? "",
    performerDisciplines: input.performerDisciplines ?? [],
    bookingsEnabled: input.bookingsEnabled ?? true,
    updatedAt: serverTimestamp()
  });
}

export async function updateSpotPlanBenefits(spotId: string, planBenefits: PlanBenefits) {
  await updateDoc(doc(getFirestoreDb(), "spots", spotId), {
    planBenefits,
    updatedAt: serverTimestamp()
  });
}

export async function setSpotPublished(spotId: string, isPublished: boolean) {
  await updateDoc(doc(getFirestoreDb(), "spots", spotId), {
    isPublished,
    updatedAt: serverTimestamp()
  });
}

/**
 * Firestoreのメンバー情報からプラン合計を集計する（フォールバック用）。
 * 運営者向けの正確な収益表示には /api/stripe/spot-revenue を使用すること。
 * active と canceling（解約予定）の両方を集計対象とする。
 */
export async function getSpotRevenueSummary(
  spotId: string
): Promise<{ total: number; count: number }> {
  const [activeSnap, cancelingSnap] = await Promise.all([
    getDocs(query(collection(getFirestoreDb(), "spots", spotId, "members"), where("status", "==", "active"))),
    getDocs(query(collection(getFirestoreDb(), "spots", spotId, "members"), where("status", "==", "canceling")))
  ]);
  const snapshot = { docs: [...activeSnap.docs, ...cancelingSnap.docs] };

  let total = 0;
  let count = 0;

  snapshot.docs.forEach((item) => {
    total += Number(item.data().planAmount ?? 0);
    count++;
  });

  return { total, count };
}
