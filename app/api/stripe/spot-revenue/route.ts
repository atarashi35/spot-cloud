/**
 * GET /api/stripe/spot-revenue?spotId=xxx
 *
 * Stripe を直接クエリして SPOT の正確な収益情報を返す。
 * Firestore の socioCount は Webhook のズレで不正確になり得るため、
 * 運営者向けのダッシュボードではこのエンドポイントを使用する。
 *
 * 計算方針:
 *   Stripe手数料 = 決済総額 × STRIPE_PROCESSING_FEE_RATE
 *   SPOT利用料   = (決済総額 - Stripe手数料) × PLATFORM_FEE_PERCENT%
 *   振込予定額   = 決済総額 - Stripe手数料 - SPOT利用料
 *
 * レスポンス:
 *   socioCount       - アクティブな応援会員数（解約予定含む）
 *   cancelingCount   - 解約予定の応援会員数
 *   grossMonthly     - 月額決済総額
 *   estimatedStripeFee - 推定Stripe手数料（3.6%ベース、実際は変動あり）
 *   platformFee      - SPOT利用料
 *   netMonthly       - 振込予定額
 *   platformFeePercent - SPOT利用料率 (%)
 *   stripeFeePercent   - Stripe手数料率 (%)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import {
  PLATFORM_FEE_PERCENT,
  STRIPE_PROCESSING_FEE_RATE,
  calcRevenue,
  stripe
} from "@/lib/stripe/config";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing_auth" }, { status: 401 });
  }

  const spotId = request.nextUrl.searchParams.get("spotId");

  if (!spotId) {
    return NextResponse.json({ error: "missing_spot_id" }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(
      authorization.slice("Bearer ".length)
    );

    // SPOT の所有者確認
    const spotDoc = await getAdminDb().doc(`spots/${spotId}`).get();

    if (!spotDoc.exists) {
      return NextResponse.json({ error: "spot_not_found" }, { status: 404 });
    }

    if (spotDoc.data()?.ownerUid !== decodedToken.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // metadata.spotId で Stripe サブスクリプションを検索（Firestore非依存）
    const searchResult = await stripe.subscriptions.search({
      query: `metadata['spotId']:'${spotId}'`,
      limit: 100
    });

    const activeSubs = searchResult.data.filter(
      (s) => s.status === "active" || s.status === "trialing"
    );
    const cancelingSubs = activeSubs.filter((s) => s.cancel_at_period_end);

    // 決済総額の集計
    let grossMonthly = 0;
    for (const sub of activeSubs) {
      grossMonthly += Number(sub.metadata.planAmount ?? 0);
    }

    // 費用計算
    // Stripe手数料を先に控除し、残額に対して PLATFORM_FEE_PERCENT% を課金
    const { stripeFee: estimatedStripeFee, platformFee, payout: netMonthly } =
      calcRevenue(grossMonthly);

    return NextResponse.json({
      socioCount: activeSubs.length,
      cancelingCount: cancelingSubs.length,
      grossMonthly,
      estimatedStripeFee,
      platformFee,
      netMonthly,
      platformFeePercent: PLATFORM_FEE_PERCENT,
      stripeFeePercent: STRIPE_PROCESSING_FEE_RATE * 100
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "internal_error",
        detail: error instanceof Error ? error.message : "unknown"
      },
      { status: 500 }
    );
  }
}
