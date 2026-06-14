import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { getAdminEmails } from "@/lib/auth/admin";
import { Spot, SpotCategory } from "@/lib/types";

function normalizeSpotCategory(value: unknown): SpotCategory {
  const raw = String(value ?? "");

  // 旧カテゴリ → 新カテゴリの読み替え（既存データ互換）
  const legacyMap: Record<string, SpotCategory> = {
    "神社": "伝統文化・芸能",
    "寺社仏閣": "伝統文化・芸能",
    "神社・寺院": "伝統文化・芸能",
    "アート": "ギャラリー・アート",
    "音楽・ライブ": "ライブハウス・音楽",
    "文化施設": "ミニシアター・映画館"
  };

  if (legacyMap[raw]) {
    return legacyMap[raw];
  }

  const valid: SpotCategory[] = [
    "本屋・書店",
    "ミニシアター・映画館",
    "ライブハウス・音楽",
    "劇場・パフォーマンス",
    "ギャラリー・アート",
    "伝統文化・芸能",
    "カフェ・バー",
    "文化プロジェクト",
    "その他"
  ];

  return valid.includes(raw as SpotCategory) ? (raw as SpotCategory) : "その他";
}

function parseTimestamp(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

function mapAdminSpot(id: string, data: Record<string, unknown>): Spot {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    shortDescription: String(data.shortDescription ?? ""),
    category: normalizeSpotCategory(data.category),
    address: String(data.address ?? ""),
    prefecture: String(data.prefecture ?? ""),
    city: String(data.city ?? ""),
    coverImageUrl: typeof data.coverImageUrl === "string" && data.coverImageUrl ? data.coverImageUrl : undefined,
    coverTone: typeof data.coverTone === "string" ? data.coverTone : "from-stone-300 via-sand to-emerald-100",
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

export async function verifyAdminToken(authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new Error("missing_auth");
  }

  const decodedToken = await getAdminAuth().verifyIdToken(authorizationHeader.slice("Bearer ".length));
  const email = decodedToken.email?.toLowerCase();

  if (!email || !new Set(getAdminEmails()).has(email)) {
    throw new Error("forbidden");
  }

  return decodedToken;
}

export async function listAdminSpots() {
  const snapshot = await getAdminDb().collection("spots").orderBy("updatedAt", "desc").get();
  return snapshot.docs.map((item) => mapAdminSpot(item.id, item.data()));
}

export async function updateAdminSpotStatus(spotId: string, input: { isPublished?: boolean; isSuspended?: boolean }) {
  await getAdminDb().doc(`spots/${spotId}`).update({
    ...(typeof input.isPublished === "boolean" ? { isPublished: input.isPublished } : {}),
    ...(typeof input.isSuspended === "boolean" ? { isSuspended: input.isSuspended } : {}),
    updatedAt: new Date().toISOString()
  });
}
