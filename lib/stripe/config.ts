import Stripe from "stripe";

export const stripe =
  process.env.STRIPE_SECRET_KEY &&
  new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil"
  });

/**
 * SPOT利用料率 (%)
 * 「Stripe手数料控除後の純額」に対して課金する率。
 * 例: 決済¥100 → Stripe控除後¥96.4 → SPOT利用料¥9.64
 */
export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? "10");

/**
 * Stripe決済手数料率 (小数)
 * 日本国内カード標準: 3.6%（固定手数料なし）
 * 環境変数 STRIPE_PROCESSING_FEE_RATE で上書き可能
 */
export const STRIPE_PROCESSING_FEE_RATE =
  Number(process.env.STRIPE_PROCESSING_FEE_RATE ?? "3.6") / 100;

/**
 * Stripeサブスクリプションに設定する application_fee_percent
 *
 * 設計方針:
 *   SPOT利用料 = (決済額 - Stripe手数料) × PLATFORM_FEE_PERCENT%
 *   振込予定額  = 決済額 - Stripe手数料 - SPOT利用料
 *
 * application_fee_percent を以下の式で設定すると、
 * Stripe側の自動分配がこの設計通りになる:
 *
 *   billingFee = PLATFORM_FEE + STRIPE_FEE × (1 - PLATFORM_FEE / 100)
 *
 * 例 (PLATFORM=10%, STRIPE=3.6%):
 *   = 10 + 3.6 × 0.9 = 13.24%
 *
 * → 振込予定額 = 決済額 × (1 - 0.1324) ≈ 86.76%
 *   ¥100決済 → 振込 ¥87 / ¥300 → ¥260 / ¥500 → ¥434
 */
export const BILLING_APPLICATION_FEE_PERCENT =
  PLATFORM_FEE_PERCENT +
  STRIPE_PROCESSING_FEE_RATE * 100 * (1 - PLATFORM_FEE_PERCENT / 100);

/**
 * この金額(円)未満のConnect残高は送金せず持ち越す(app/api/cron/quarterly-payout)。
 * 手数料(¥495程度/回)が送金額の1割程度に収まる水準。
 * オーナー向けダッシュボード(spot-revenue API)でも進捗表示に使う。
 */
export const MIN_PAYOUT_AMOUNT = 5000;

/**
 * 決済額から各費用を計算するユーティリティ
 * UIの表示・API返却値の算出に使う
 */
export function calcRevenue(grossAmount: number) {
  const stripeFee = Math.round(grossAmount * STRIPE_PROCESSING_FEE_RATE);
  const netAfterStripe = grossAmount - stripeFee;
  const platformFee = Math.round(netAfterStripe * (PLATFORM_FEE_PERCENT / 100));
  const payout = grossAmount - stripeFee - platformFee;

  return { grossAmount, stripeFee, netAfterStripe, platformFee, payout };
}
