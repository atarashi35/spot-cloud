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
    const db = getAdminDb();

    const directSnap = await db.doc(`spots/${body.spotId}/members/${decodedToken.uid}`).get();

    if (!directSnap.exists) {
      return NextResponse.json(
        { error: "membership_not_found", message: "このSPOTの加入情報が見つかりませんでした。サポートにお問い合わせください。" },
        { status: 404 }
      );
    }

    const memberData = directSnap.data() as Record<string, unknown>;
    const customerId = String(memberData.stripeCustomerId ?? "");

    if (!customerId) {
      return NextResponse.json(
        { error: "missing_customer_id", message: "Stripe顧客情報が見つかりませんでした。" },
        { status: 400 }
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin}/account`
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    return NextResponse.json(
      {
        error: "portal_setup_error",
        message: error instanceof Error ? error.message : "Billing Portal の初期化に失敗しました。"
      },
      { status: 500 }
    );
  }
}
