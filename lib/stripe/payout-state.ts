import type Stripe from "stripe";

/** 受取(Connect)の実状態。none=未連携 / review=審査中 / action=要対応 / ready=入金可 */
export type PayoutState = "none" | "review" | "action" | "ready";

/**
 * Stripe Account オブジェクトから受取状態を導出する純関数。
 * webhook（account.updated）と状態照会APIで共通利用する。
 */
export function payoutStateFromAccount(account: Stripe.Account): PayoutState {
  const transfersEnabled =
    account.capabilities?.transfers === "active" || Boolean(account.payouts_enabled);
  const ready =
    Boolean(account.details_submitted) &&
    transfersEnabled &&
    Boolean(account.payouts_enabled) &&
    (account.requirements?.currently_due?.length ?? 0) === 0;
  if (ready) return "ready";
  const reason = account.requirements?.disabled_reason;
  if (reason === "under_review" || reason === "requirements.pending_verification") {
    return "review";
  }
  return "action";
}
