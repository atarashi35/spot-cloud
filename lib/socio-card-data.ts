import type { UserFollow, UserMembership } from "@/lib/types";

type CardMembership = Pick<UserMembership, "spotName" | "joinedAt" | "spotId">;
export type SocioCardData = { uid: string; displayName: string; spotCount: number; memberships: CardMembership[] };

export function buildSocioCardData(
  uid: string,
  displayName: string,
  memberships: Pick<UserMembership, "spotName" | "joinedAt" | "spotId" | "status">[],
  follows: Pick<UserFollow, "spotId" | "spotName" | "followedAt">[] = []
): SocioCardData {
  const byId = new Map<string, CardMembership>();
  for (const membership of memberships) {
    if (membership.status !== "canceled") byId.set(membership.spotId, membership);
  }
  for (const follow of follows) {
    if (!byId.has(follow.spotId)) byId.set(follow.spotId, { spotId: follow.spotId, spotName: follow.spotName, joinedAt: follow.followedAt });
  }
  const active = [...byId.values()];
  return { uid, displayName, spotCount: active.length, memberships: active };
}

export function buildShareContent(data: SocioCardData): { text: string; url: string } {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "https://spotcloud.app");
  const first = data.memberships[0];
  if (!first) return { text: "SPOT会員になりました。", url: `${base}/spots` };
  const names = data.memberships.map((m) => `「${m.spotName}」`).join("・");
  return { text: `${names}のサポーターになりました。`, url: `${base}/spots/${first.spotId}` };
}
