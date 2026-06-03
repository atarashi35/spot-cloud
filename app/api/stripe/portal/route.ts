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

    const membersCol = db.collection(`spots/${body.spotId}/members`);

    // 1. uid をドキュメントIDとして直接引く
    let memberData: Record<string, unknown> | null = null;
    const directSnap = await db.doc(`spots/${body.spotId}/members/${decodedToken.uid}`).get();
    if (directSnap.exists) {
      memberData = directSnap.data() as Record<string, unknown>;
    }

    // 2. uid フィールドで検索（ドキュメントIDが別UIDになっているケース）
    if (!memberData) {
      const byUid = await membersCol.where("uid", "==", decodedToken.uid).limit(1).get();
      if (!byUid.empty) {
        memberData = byUid.docs[0].data() as Record<string, unknown>;
      }
    }

    // 3. メールアドレスで検索（認証方法が変わったケース）
    if (!memberData && decodedToken.email) {
      const byEmail = await membersCol.where("email", "==", decodedToken.email).limit(1).get();
      if (!byEmail.empty) {
        memberData = byEmail.docs[0].data() as Record<string, unknown>;
      }
    }

    if (!memberData) {
      return NextResponse.json(
        { error: "membership_not_found", message: "このSPOTの加入情報が見つかりませんでした。サポートにお問い合わせください。" },
        { status: 404 }
      );
    }

    const customerId = String(memberData.stripeCustomerId ?? "");

    if (!customerId) {
      return NextResponse.json(
        { error: "missing_customer_id", message: "Stripe顧客情報が見つかりませんでした。" },
        { status: 400 }
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${request.nextUrl.origin}/account`
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
