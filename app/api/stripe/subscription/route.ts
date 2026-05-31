import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe/config";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing_auth" }, { status: 401 });
  }

  const spotId = request.nextUrl.searchParams.get("spotId");

  if (!spotId) {
    return NextResponse.json({ error: "missing_spot_id" }, { status: 400 });
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(
      authorization.slice("Bearer ".length)
    );

    const memberDoc = await getAdminDb()
      .doc(`spots/${spotId}/members/${decodedToken.uid}`)
      .get();

    if (!memberDoc.exists) {
      return NextResponse.json({ nextBillingDate: null });
    }

    const subscriptionId = String(memberDoc.data()?.stripeSubscriptionId ?? "");

    if (!subscriptionId || !stripe) {
      return NextResponse.json({ nextBillingDate: null });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    // current_period_end は Stripe API バージョンによって型定義が揺れるため
    // ランタイムで取得する
    const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end;
    const nextBillingDate =
      typeof periodEnd === "number"
        ? new Date(periodEnd * 1000).toISOString()
        : null;

    return NextResponse.json({ nextBillingDate });
  } catch {
    // Stripe未設定・サブスクリプション取得失敗は null を返して続行
    return NextResponse.json({ nextBillingDate: null });
  }
}
