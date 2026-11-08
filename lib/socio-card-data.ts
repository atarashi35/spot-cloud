// サーバー・クライアント両方から使える共有ロジック（"use client" なし）
import type { UserMembership } from "@/lib/types";

export type SocioCardData = {
  uid: string;
  displayName: string;
  spotCount: number;
  memberships: Pick<UserMembership, "spotName" | "joinedAt" | "spotId">[];
};

export function buildSocioCardData(
  uid: string,
  displayName: string,
  memberships: Pick<UserMembership, "spotName" | "joinedAt" | "spotId" | "status">[]
): SocioCardData {
  const active = memberships.filter((m) => m.status !== "canceled");
  return {
    uid,
    displayName,
    spotCount: active.length,
    memberships: active,
  };
}

export function buildShareContent(data: SocioCardData): { text: string; url: string } {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "https://spotcloud.app");

  const first = data.memberships[0];

  if (!first) {
    return {
      text: "SPOT会員になりました。",
      url: `${base}/spots`,
    };
  }

  if (data.memberships.length === 1) {
    return {
      text: `「${first.spotName}」のサポーターになりました。応援しています！`,
      url: `${base}/spots/${first.spotId}`,
    };
  }

  const names = data.memberships.map((m) => `「${m.spotName}」`).join("・");
  return {
    text: `${names}のサポーターになりました。`,
    url: `${base}/spots/${first.spotId}`,
  };
}
