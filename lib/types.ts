export type PlanAmount = 100 | 300 | 500;

export const planOptions = [100, 300, 500] as const satisfies readonly PlanAmount[];

export type SpotCategory =
  | "カフェ"
  | "神社"
  | "アート"
  | "文化施設"
  | "市民団体"
  | "スポーツ"
  | "商店街"
  | "自治会"
  | "クリエイター"
  | "その他";

export type MembershipStatus = "active" | "canceled" | "past_due";

export interface Spot {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: SpotCategory;
  address: string;
  prefecture: string;
  city: string;
  coverImageUrl?: string;
  coverTone: string;
  ownerUid: string;
  stripeConnectedAccountId?: string;
  socioCount: number;
  isPublished: boolean;
  isSuspended?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpotMembership {
  uid: string;
  planAmount: PlanAmount;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: MembershipStatus;
  joinedAt: string;
  updatedAt: string;
}

export interface UserMembership {
  spotId: string;
  spotName: string;
  planAmount: PlanAmount;
  status: MembershipStatus;
  joinedAt: string;
}

export interface SpotPost {
  id: string;
  spotId: string;
  title: string;
  body: string;
  imageUrl?: string;
  publishDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpotEvent {
  id: string;
  spotId: string;
  title: string;
  description: string;
  startAt: string;
  endAt?: string;
  location?: string;
  hasJoinButton: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventParticipant {
  uid: string;
  displayName?: string;
  email?: string;
  joinedAt: string;
}

export interface User {
  uid: string;
  displayName: string;
  role: "guest" | "member" | "owner" | "admin";
  ownerSpotIds?: string[];
  joinedSpotIds?: string[];
}
