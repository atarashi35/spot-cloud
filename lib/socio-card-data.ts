// サーバー・クライアント両方から使える共有ロジック（"use client" なし）
import type { UserMembership } from "@/lib/types";

export type SocioCardData = {
  uid: string;
  displayName: string;
  spotCount: number;
  verifyUrl: string;
  memberships: Pick<UserMembership, "spotName" | "joinedAt" | "spotId">[];
};

export function buildSocioCardData(
  uid: string,
  displayName: string,
  memberships: Pick<UserMembership, "spotName" | "joinedAt" | "spotId" | "status">[]
): SocioCardData {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "https://spotcloud.app");
  const active = memberships.filter((m) => m.status !== "canceled");
  return {
    uid,
    displayName,
    spotCount: active.length,
    verifyUrl: `${base}/verify/socio/${uid}`,
    memberships: active,
  };
}

export function buildShareText(data: SocioCardData): string {
  const n = data.spotCount;
  return n === 0 ? "私はSPOTのソシオです。" : `私は${n}つのSPOTのソシオです。`;
}
