/**
 * 四半期バッチ送金ジョブ (Vercel Cron から起動)
 *
 * Connect送金は "manual" スケジュールで作成しており(connect/onboarding/route.ts)、
 * Stripeが自動送金しない代わりに、このジョブがまとめて送金する。
 * 送金1回ごとに ¥275+0.25% の手数料 + その月 ¥220 のアクティブアカウント手数料がかかるため、
 * 頻度を四半期に落とすことでSPOT側のConnect固定費を店舗あたり ¥495/月 → 約¥165/月相当に抑える。
 *
 * vercel.json の crons 設定で 1,4,7,10月の1日に起動する想定。
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe/config";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const spotsSnapshot = await getAdminDb().collection("spots").get();
  const accountIds = spotsSnapshot.docs
    .map((doc) => doc.data().stripeConnectedAccountId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const results: Array<{ accountId: string; status: string; amount?: number; error?: string }> = [];

  for (const accountId of accountIds) {
    try {
      const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
      const jpyAvailable = balance.available.find((b) => b.currency === "jpy");
      const amount = jpyAvailable?.amount ?? 0;

      if (amount <= 0) {
        results.push({ accountId, status: "skipped_no_balance" });
        continue;
      }

      const payout = await stripe.payouts.create(
        { amount, currency: "jpy" },
        { stripeAccount: accountId }
      );

      results.push({ accountId, status: "paid_out", amount: payout.amount });
    } catch (error) {
      results.push({
        accountId,
        status: "error",
        error: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
