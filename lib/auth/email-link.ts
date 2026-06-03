/**
 * Firebase Email Link (passwordless) 認証で使う共有定数と型
 */

/** メールリンク送信時に保存するサインイン状態（localStorage） */
export const EMAIL_LINK_STORAGE_KEY = "spot_email_sign_in_state";

export type EmailSignInState = {
  /** 認証リンクを送信したメールアドレス */
  email: string;
  /** 加入対象の SPOT ID */
  spotId: string;
  /** 選択中のプラン金額 */
  planAmount: number;
};

/** 認証完了後にモーダルを自動オープンするための一時情報（sessionStorage） */
export const EMAIL_JOIN_PENDING_KEY = "spot_email_join_pending";

export type EmailJoinPending = {
  spotId: string;
  planAmount: number;
};
