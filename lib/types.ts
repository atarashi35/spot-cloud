/**
 * 口数制：1口 = ¥100。会員は1口以上を任意の口数で購入する。
 * planAmount は「口数 × 100」の月額（円）。既存の固定プラン会員（¥300/¥500/¥1,000）は
 * そのまま 3口/5口/10口 として解釈される。口数⇔金額の変換は lib/plan.ts を使う。
 * 特典は口数閾値（5口以上 / 10口以上）でプラットフォーム統一。
 */
export type PlanAmount = number;

/** 1口の金額（円）。 */
export const KO_UNIT_AMOUNT = 100;

/** 入会時の最小口数。 */
export const MIN_KO = 1;

/** 入会画面のステッパー初期値（口数）。 */
export const DEFAULT_KO = 3;

/** 申込時にデフォルトで選択されるプラン金額（口数換算 × ¥100）。 */
export const defaultPlanAmount: PlanAmount = DEFAULT_KO * KO_UNIT_AMOUNT;

export type SignupPlanAmount = PlanAmount;

/** 新規受付可能な金額かどうか（¥100以上かつ¥100単位） */
export function isSignupPlan(value: number): value is SignupPlanAmount {
  return Number.isInteger(value) && value >= KO_UNIT_AMOUNT && value % KO_UNIT_AMOUNT === 0;
}

export type SpotCategory =
  | "ライブハウス・音楽"
  | "劇場・パフォーマンス"
  | "ミニシアター・映画館"
  | "ギャラリー・アート"
  | "伝統文化・芸能"
  | "本屋・書店"
  | "カフェ・バー"
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

/**
 * 口数閾値ごとの特典。キーは口数（5口以上 / 10口以上）。
 * プラットフォーム共通の閾値で、各特典の文言はオーナーが設定する。
 */
export type PlanBenefits = {
  5?: string;
  10?: string;
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
  /** undefined は既存の「拠点」として扱う（後方互換）。"performer" は出演依頼機能の対象。 */
  spotType?: "venue" | "performer";
  /** 出演料の目安（円）。spotType: "performer" のみ。演者はこの金額を満額受け取る。 */
  performerFee?: number;
  /** 「交通費別途」等の補足。spotType: "performer" のみ。 */
  performerFeeNote?: string;
  /** 自由記述の活動分野タグ（例: ["弾き語り","MC"]）。表示のみ、検索フィルタ配線はしない。 */
  performerDisciplines?: string[];
  /** false のときオーナーが出演依頼の受付を一時停止。undefined は受付中として扱う。 */
  bookingsEnabled?: boolean;
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
  type: "image" | "pdf" | "video";
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
  /**
   * 応援会員限定（isPublic=false）のとき、閲覧に必要な最低口数（金額換算）。
   * undefined: 全会員が閲覧可 / 500: 5口以上 / 1000: 10口以上。
   * 口数が多いほど下位限定も閲覧できる（閾値方式）。
   */
  minPlanAmount?: SignupPlanAmount;
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

// ─── 出演依頼 ────────────────────────────────────────────────────────

/**
 * pending          : 依頼受信、オーナー未対応
 * accepted         : オーナーが受諾、支払いリンク発行可能
 * declined         : オーナーが辞退
 * payment_pending  : 支払いリンク発行済み、未決済
 * paid             : 決済完了
 * completed        : 実演後、オーナーが完了マーク
 * canceled         : 決済前 or 決済後に組織者/オーナーがキャンセル
 */
export type BookingRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "payment_pending"
  | "paid"
  | "completed"
  | "canceled";

export interface BookingRequest {
  id: string;
  spotId: string;
  spotName: string;
  status: BookingRequestStatus;

  // 依頼者（SPOTアカウント不要）
  organizerName: string;
  organizerOrg?: string;
  organizerEmail: string;
  organizerPhone?: string;

  // 依頼内容
  eventDate: string;
  eventLocation: string;
  eventDescription: string;
  message?: string;

  // 金額（オーナー受諾時に確定、以降は不変のスナップショット）
  /** 演者の受取額（円）。spot.performerFee のスナップショット。 */
  performerFeeAmount: number;
  /** SPOT手数料（円）。lib/booking/fee-tiers.ts で算出したスナップショット。 */
  platformFeeAmount: number;
  /** 決済総額（円）= performerFeeAmount + platformFeeAmount。 */
  totalAmount: number;

  declineReason?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  paidAt?: string;

  createdAt: string;
  updatedAt: string;
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
