/**
 * 新規受付プランは ¥300 / ¥500 / ¥1,000（デフォルト ¥500）。
 * ¥100 はレガシープラン。新規受付は停止済みで、既存会員の表示互換のためだけに型に残している。
 * 特典はオンボーディングから分離し、運営中SPOTの「特典設定」から任意で後付け。
 * フリー枠（お気持ち金額）はベータ後の検証材料。
 */
export type PlanAmount = 100 | 300 | 500 | 1000;

export const planOptions = [300, 500, 1000] as const satisfies readonly PlanAmount[];

/** 申込時にデフォルトで選択されるプラン金額。 */
export const defaultPlanAmount: PlanAmount = 500;

export type SignupPlanAmount = (typeof planOptions)[number];

/** 新規受付プランかどうか（レガシー金額を弾く） */
export function isSignupPlan(value: number): value is SignupPlanAmount {
  return (planOptions as readonly number[]).includes(value);
}

export type SpotCategory =
  | "本屋・書店"
  | "ミニシアター・映画館"
  | "ライブハウス・音楽"
  | "劇場・パフォーマンス"
  | "ギャラリー・アート"
  | "神社・寺院"
  | "文化プロジェクト"
  | "その他";

/**
 * active    : 有効な応援会員
 * canceling : 解約予定（cancel_at_period_end=true）。期末まで請求は続く
 * past_due  : 支払い失敗・未払い
 * canceled  : 解約済み
 */
export type MembershipStatus = "active" | "canceling" | "past_due" | "canceled";

export type SocioAgeRange =
  | "10代以下"
  | "20代"
  | "30代"
  | "40代"
  | "50代"
  | "60代以上";

export type SocioGender = "女性" | "男性" | "その他" | "回答しない";

export type SocialLinks = {
  website?: string;
  instagram?: string;
  twitter?: string;
  line?: string;
  youtube?: string;
  facebook?: string;
};

export type PlanBenefits = {
  300?: string;
  500?: string;
  1000?: string;
};

export type TeamMember = {
  name: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
};

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
  galleryImageUrls?: string[];
  coverTone: string;
  ownerUid: string;
  stripeConnectedAccountId?: string;
  socioCount: number;
  isPublished: boolean;
  isSuspended?: boolean;
  phone?: string;
  email?: string;
  socialLinks?: SocialLinks;
  planBenefits?: PlanBenefits;
  opinionBoxEnabled?: boolean;
  teamMembers?: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface SpotMembership {
  uid: string;
  displayName?: string;
  email?: string;
  affiliation?: string;
  ageRange?: SocioAgeRange;
  gender?: SocioGender;
  planAmount: PlanAmount;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: MembershipStatus;
  joinedAt: string;
  updatedAt: string;
  /**
   * 直近の解約確定日時（ISO文字列）。
   * 再登録後30日以内はアンケート投票権なし。
   */
  canceledAt?: string;
  address?: string;
  // 応援会員プロフィール（users/{uid} から結合）
  avatarUrl?: string;
  occupation?: string;
  specialty?: string;
  bio?: string;
}

export interface UserMembership {
  spotId: string;
  spotName: string;
  affiliation?: string;
  planAmount: PlanAmount;
  status: MembershipStatus;
  joinedAt: string;
}

export interface PostAttachment {
  url: string;
  type: "image" | "pdf";
  name: string; // 表示用ファイル名
}

export interface SpotPost {
  id: string;
  spotId: string;
  title: string;
  body: string;
  /** @deprecated 旧フィールド。attachments に移行済み */
  imageUrl?: string;
  attachments?: PostAttachment[];
  publishDate: string;
  /** true: 誰でも閲覧可、false/undefined: 応援会員限定 */
  isPublic: boolean;
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
  imageUrl?: string;
  /** true: 誰でも閲覧可、false/undefined: 応援会員限定 */
  isPublic: boolean;
  hasJoinButton: boolean;
  /** 参加登録人数（応援会員には人数のみ公開。名前・メールは非公開） */
  participantCount: number;
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

export type NotificationType = "new_post" | "new_event" | "new_member";

// ─── みんなの声 ────────────────────────────────────────────────────────

export type VoteType = "poll" | "open_question";
export type VoteStatus = "open" | "closed";

export interface PollOption {
  id: string;
  text: string;
}

export interface SpotVote {
  id: string;
  spotId: string;
  type: VoteType;
  status: VoteStatus;
  title: string;
  body?: string;
  options?: PollOption[]; // poll のみ
  deadline?: string;      // ISO, 任意
  responseCount: number;  // 重複防止用カウンタ（denormalized）
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoteResponse {
  uid: string;
  optionId?: string;  // poll のみ
  text?: string;      // open_question のみ
  amount: number;     // planAmount（オーナー集計用）
  createdAt: string;
}

export interface OpinionBoxEntry {
  id: string;
  text: string;
  uid: string;
  amount: number;
  isRead: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  spotId: string;
  spotName: string;
  resourceId?: string;
  isRead: boolean;
  createdAt: string;
}
