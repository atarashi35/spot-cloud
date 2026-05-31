/**
 * GET /api/stripe/spot-revenue?spotId=xxx
 *
 * Stripe を直接クエリして SPOT の正確な収益情報を返す。
 * Firestore の socioCount は Webhook のズレで不正確になり得るため、
 * 運営者向けのダッシュボードではこのエンドポイントを使用する。
 *
 * レスポンス:
 *   socioCount      - アクティブなソシオ数（解約予定を含む）
 *   cancelingCount  - 解約予定のソシオ数（cancel_at_period_end=true）
 *   grossMonthly    - 月額決済総額（ソシオが支払う金額の合計）
 *   netMonthly      - 振込予定額（gross × (1 - PLATFORM_FEE_PERCENT/100)）
 *   platformFeePercent - SPOT利用料率（%）
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { PLATFORM_FEE_PERCENT, stripe } from "@/lib/stripe/config";

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

    // metadata.spotId で Stripe サブスクリプションを検索
    // Stripe search API を使うことで Firestore のズレに依存しない
    const searchResult = await stripe.subscriptions.search({
      query: `metadata['spotId']:'${spotId}'`,
      limit: 100
    });

    // active と trialing（trial期間中）を「有効なソシオ」として扱う
    const activeSubs = searchResult.data.filter(
      (s) => s.status === "active" || s.status === "trialing"
    );

    // cancel_at_period_end=true のものは期末解約予定ソシオ
    const cancelingSubs = activeSubs.filter((s) => s.cancel_at_period_end);

    // Stripe サブスクリプションの metadata.planAmount を合計
    let grossMonthly = 0;
    for (const sub of activeSubs) {
      grossMonthly += Number(sub.metadata.planAmount ?? 0);
    }

    // 振込予定額 = 決済額 × (1 - SPOT利用料率)
    // Stripe決済手数料はSPOT Cloud（プラットフォーム）が負担するため差し引かない
    const netMonthly = Math.floor(grossMonthly * (1 - PLATFORM_FEE_PERCENT / 100));

    return NextResponse.json({
      socioCount: activeSubs.length,
      cancelingCount: cancelingSubs.length,
      grossMonthly,
      netMonthly,
      platformFeePercent: PLATFORM_FEE_PERCENT
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
