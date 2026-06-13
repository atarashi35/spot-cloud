import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import {
  BILLING_APPLICATION_FEE_PERCENT,
  PLATFORM_FEE_PERCENT,
  STRIPE_PROCESSING_FEE_RATE,
  getStripePriceId,
  stripe
} from "@/lib/stripe/config";
import { PlanAmount, SocioAgeRange, SocioGender, isSignupPlan } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // ─── 認証必須（Firebase Auth UID にのみ紐づける） ────────────────
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "auth_required", message: "応援会員登録にはログインが必要です。" },
        { status: 401 }
      );
    }

    const decodedToken = await getAdminAuth().verifyIdToken(
      authorization.slice("Bearer ".length)
    );

    // ─── リクエスト検証 ───────────────────────────────────────────────
    const body = (await request.json()) as {
      spotId?: string;
      planAmount?: number;
      name?: string;
      affiliation?: string;
      ageRange?: SocioAgeRange;
      gender?: SocioGender;
      address?: string;
    };
    const planAmount = body.planAmount as PlanAmount | undefined;

    if (!body.spotId || !planAmount || !isSignupPlan(planAmount)) {
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
          message: "STRIPE_PRICE_ID_300 を .env.local に設定してください。"
        },
        { status: 500 }
      );
    }

    // ─── SPOT 確認 ────────────────────────────────────────────────────
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
    const transfersActive =
      account.capabilities?.transfers === "active" || account.payouts_enabled;
    const connectReady = account.details_submitted && transfersActive;

    if (!connectReady) {
      return NextResponse.json(
        {
          error: "connect_not_ready",
          message:
            "この SPOT の受取設定はまだ完了していません。Stripe Connect の設定完了後に加入受付を開始できます。"
        },
        { status: 409 }
      );
    }

    // ─── Checkout セッション作成 ──────────────────────────────────────
    const spotName = String(spotSnapshot.data()?.name ?? "");
    const checkoutUid = decodedToken.uid;               // 必ず Firebase Auth UID
    const checkoutEmail = decodedToken.email ?? "";
    const displayName = body.name?.trim() ?? "";
    const affiliation = body.affiliation?.trim() ?? "";
    const ageRange = body.ageRange ?? "";
    const gender = body.gender ?? "";
    const address = body.address?.trim() ?? "";

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // {CHECKOUT_SESSION_ID} は Stripe がリダイレクト時に実際の ID に置換する
      success_url: `${origin}/spots/${body.spotId}?checkout=success&sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/spots/${body.spotId}`,
      customer_email: checkoutEmail || undefined,
      subscription_data: {
        // SPOT利用料はStripe手数料控除後の純額に対して PLATFORM_FEE_PERCENT% を課金する設計。
        // この application_fee_percent = BILLING_APPLICATION_FEE_PERCENT (≈13.24%) で実現。
        application_fee_percent: BILLING_APPLICATION_FEE_PERCENT,
        transfer_data: { destination: connectedAccountId },
        metadata: {
          spotId: body.spotId,
          spotName,
          uid: checkoutUid,
          displayName,
          email: checkoutEmail,
          affiliation,
          ageRange,
          gender,
          address,
          planAmount: String(planAmount),
          stripeConnectedAccountId: connectedAccountId,
          platformFeePercent: String(PLATFORM_FEE_PERCENT),
          stripeFeePercent: String(STRIPE_PROCESSING_FEE_RATE * 100),
          billingFeePercent: String(BILLING_APPLICATION_FEE_PERCENT)
        }
      },
      metadata: {
        spotId: body.spotId,
        spotName,
        uid: checkoutUid,
        displayName,
        email: checkoutEmail,
        affiliation,
        ageRange,
        gender,
        planAmount: String(planAmount),
        stripeConnectedAccountId: connectedAccountId,
        platformFeePercent: String(PLATFORM_FEE_PERCENT),
        stripeFeePercent: String(STRIPE_PROCESSING_FEE_RATE * 100),
        billingFeePercent: String(BILLING_APPLICATION_FEE_PERCENT)
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
