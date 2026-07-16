import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe/config";
import { getBookingRequestById, markBookingRequestPaymentPending } from "@/lib/server/bookings";

/**
 * 出演依頼の決済セッション作成。組織者はFirebase Authを持たない前提のため、
 * bookingRequestId（Firestore自動採番、事実上推測不可能）の保持自体を
 * 認可トークンとして扱う。既存の応援会員Checkoutの success_url に埋め込む
 * {CHECKOUT_SESSION_ID} と同じ信頼モデル（app/api/stripe/checkout/route.ts参照）。
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
    }

    const body = (await request.json()) as { spotId?: string; bookingRequestId?: string };

    if (!body.spotId || !body.bookingRequestId) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const booking = await getBookingRequestById(body.spotId, body.bookingRequestId);

    if (!booking) {
      return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
    }

    // 再発行を許容: accepted（未発行）/ payment_pending（再送）のみ。paid以降は拒否（冪等性ガード）。
    if (booking.status !== "accepted" && booking.status !== "payment_pending") {
      return NextResponse.json({ error: "invalid_status", message: "この依頼はお支払いに進める状態ではありません。" }, { status: 409 });
    }

    const spotSnapshot = await getAdminDb().doc(`spots/${body.spotId}`).get();
    const connectedAccountId = String(spotSnapshot.data()?.stripeConnectedAccountId ?? "");

    if (!connectedAccountId) {
      return NextResponse.json(
        { error: "connect_not_ready", message: "この依頼先はまだ受取設定が完了していないため、お支払いに進めません。" },
        { status: 409 }
      );
    }

    const account = await stripe.accounts.retrieve(connectedAccountId);
    const transfersActive = account.capabilities?.transfers === "active" || account.payouts_enabled;
    const connectReady = account.details_submitted && transfersActive;

    if (!connectReady) {
      return NextResponse.json(
        { error: "connect_not_ready", message: "この依頼先はまだ受取設定が完了していないため、お支払いに進めません。" },
        { status: 409 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

    // customer_balance（銀行振込）はセッション作成時点でCustomerが実在している必要があるため、
    // customer_creation（完了後に作成）ではなく事前にCustomerを作成して渡す。
    const customer = await stripe.customers.create({
      email: booking.organizerEmail || undefined,
      name: booking.organizerName || undefined
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "jpy",
            unit_amount: booking.totalAmount,
            product_data: { name: `出演料（${booking.spotName}）` }
          },
          quantity: 1
        }
      ],
      customer: customer.id,
      payment_method_types: ["card", "customer_balance"],
      payment_method_options: {
        customer_balance: {
          funding_type: "bank_transfer",
          bank_transfer: { type: "jp_bank_transfer" }
        }
      },
      success_url: `${origin}/booking/${body.spotId}/${body.bookingRequestId}?checkout=success&sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/${body.spotId}/${body.bookingRequestId}`,
      payment_intent_data: {
        application_fee_amount: booking.platformFeeAmount,
        transfer_data: { destination: connectedAccountId }
      },
      metadata: {
        bookingRequestId: body.bookingRequestId,
        spotId: body.spotId,
        spotName: booking.spotName,
        performerFeeAmount: String(booking.performerFeeAmount),
        platformFeeAmount: String(booking.platformFeeAmount),
        totalAmount: String(booking.totalAmount),
        organizerEmail: booking.organizerEmail,
        organizerName: booking.organizerName,
        stripeConnectedAccountId: connectedAccountId
      }
    });

    await markBookingRequestPaymentPending(body.spotId, body.bookingRequestId, session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        error: "booking_checkout_error",
        message: error instanceof Error ? error.message : "決済セッションの作成に失敗しました。"
      },
      { status: 500 }
    );
  }
}
