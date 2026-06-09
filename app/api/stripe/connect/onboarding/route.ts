import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe/config";

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const body = (await request.json()) as { spotId?: string };

    if (!body.spotId) {
      return NextResponse.json({ error: "missing_spot_id" }, { status: 400 });
    }

    const decodedToken = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    const spotRef = getAdminDb().doc(`spots/${body.spotId}`);
    const spotSnapshot = await spotRef.get();

    if (!spotSnapshot.exists) {
      return NextResponse.json({ error: "spot_not_found" }, { status: 404 });
    }

    const spot = spotSnapshot.data() ?? {};

    if (String(spot.ownerUid ?? "") !== decodedToken.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    let accountId = typeof spot.stripeConnectedAccountId === "string" ? spot.stripeConnectedAccountId : "";

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "JP",
        email: decodedToken.email,
        capabilities: {
          transfers: { requested: true }
        },
        metadata: {
          spotId: body.spotId,
          ownerUid: decodedToken.uid
        }
      });

      accountId = account.id;

      await spotRef.update({
        stripeConnectedAccountId: accountId
      });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${origin}/owner/spots/${body.spotId}/payout?connect=refresh`,
      return_url: `${origin}/owner/spots/${body.spotId}/payout?connect=return`,
      collection_options: {
        fields: "currently_due",
        future_requirements: "omit"
      }
    });

    return NextResponse.json({ url: accountLink.url, accountId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connect onboarding の開始に失敗しました。";
    const connectNotEnabled = message.includes("signed up for Connect");

    return NextResponse.json(
      {
        error: "connect_onboarding_error",
        message: connectNotEnabled
          ? "この Stripe アカウントでは Connect がまだ有効化されていません。Stripe ダッシュボードの Connect 設定を先に完了してください。"
          : message
      },
      { status: 500 }
    );
  }
}
