import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  CONNECT_OWNER_SHARE_PERCENT,
  PLATFORM_FEE_PERCENT,
  getStripePriceId,
  stripe
} from "@/lib/stripe/config";
import { planOptions } from "@/lib/types";
import { PlanAmount } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { spotId?: string; planAmount?: number };
    const planAmount = body.planAmount as PlanAmount | undefined;

    if (!body.spotId || !planAmount || !planOptions.includes(planAmount)) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json(
        {
          error: "stripe_not_configured",
          message: "STRIPE_SECRET_KEY と price id を設定すると Checkout を開始できます。"
        },
        { status: 503 }
      );
    }

    const priceId = getStripePriceId(planAmount);

    if (!priceId) {
      return NextResponse.json(
        {
          error: "price_not_configured",
          message: "STRIPE_PRICE_ID_100 / 300 / 500 を .env.local に設定してください。"
        },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const decodedToken = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    const spotSnapshot = await getAdminDb().doc(`spots/${body.spotId}`).get();

    if (!spotSnapshot.exists) {
      return NextResponse.json({ error: "spot_not_found" }, { status: 404 });
    }

    const connectedAccountId = String(spotSnapshot.data()?.stripeConnectedAccountId ?? "");

    if (!connectedAccountId) {
      return NextResponse.json(
        {
          error: "connect_not_ready",
          message: "この SPOT はまだ受取設定中のため、加入受付を開始できません。"
        },
        { status: 409 }
      );
    }

    const account = await stripe.accounts.retrieve(connectedAccountId);
    const connectReady =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    if (!connectReady) {
      return NextResponse.json(
        {
          error: "connect_not_ready",
          message: "この SPOT の受取設定はまだ完了していません。Stripe Connect の設定完了後に加入受付を開始できます。"
        },
        { status: 409 }
      );
    }

    const spotName = String(spotSnapshot.data()?.name ?? "");
    const origin = request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/spots/${body.spotId}?checkout=success`,
      cancel_url: `${origin}/spots/${body.spotId}/join?checkout=cancel`,
      customer_email: decodedToken.email,
      subscription_data: {
        application_fee_percent: PLATFORM_FEE_PERCENT,
        transfer_data: {
          destination: connectedAccountId
        },
        metadata: {
          spotId: body.spotId,
          spotName,
          uid: decodedToken.uid,
          planAmount: String(planAmount),
          stripeConnectedAccountId: connectedAccountId,
          ownerSharePercent: String(CONNECT_OWNER_SHARE_PERCENT),
          platformFeePercent: String(PLATFORM_FEE_PERCENT)
        }
      },
      metadata: {
        spotId: body.spotId,
        spotName,
        uid: decodedToken.uid,
        planAmount: String(planAmount),
        stripeConnectedAccountId: connectedAccountId,
        ownerSharePercent: String(CONNECT_OWNER_SHARE_PERCENT),
        platformFeePercent: String(PLATFORM_FEE_PERCENT)
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        error: "checkout_setup_error",
        message: error instanceof Error ? error.message : "Checkout の初期化に失敗しました。"
      },
      { status: 500 }
    );
  }
}
