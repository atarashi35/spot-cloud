import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe/config";

// 既存の connected account を別の SPOT に紐づける
export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const body = (await request.json()) as { spotId?: string; accountId?: string };

    if (!body.spotId || !body.accountId) {
      return NextResponse.json({ error: "missing_params" }, { status: 400 });
    }

    const decodedToken = await getAdminAuth().verifyIdToken(
      authorization.slice("Bearer ".length)
    );

    const db = getAdminDb();
    const spotRef = db.doc(`spots/${body.spotId}`);
    const spotSnap = await spotRef.get();

    if (!spotSnap.exists) {
      return NextResponse.json({ error: "spot_not_found" }, { status: 404 });
    }

    if (String(spotSnap.data()?.ownerUid ?? "") !== decodedToken.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // accountId が本当にこのオーナーのものか確認（他オーナーの SPOT にある accountId は使えない）
    const ownerSnap = await db
      .collection("spots")
      .where("ownerUid", "==", decodedToken.uid)
      .where("stripeConnectedAccountId", "==", body.accountId)
      .limit(1)
      .get();

    if (ownerSnap.empty) {
      return NextResponse.json({ error: "account_not_owned" }, { status: 403 });
    }

    // Stripe 側で account が有効か確認
    const account = await stripe.accounts.retrieve(body.accountId);
    const transfersActive =
      account.capabilities?.transfers === "active" || account.payouts_enabled;

    if (!account.details_submitted) {
      return NextResponse.json(
        { error: "account_not_ready", message: "選択した口座はまだ本人確認が完了していません。" },
        { status: 409 }
      );
    }

    // Firestore に紐づけ
    await spotRef.update({ stripeConnectedAccountId: body.accountId });

    return NextResponse.json({
      success: true,
      accountId: body.accountId,
      transfersActive
    });
  } catch (error) {
    return NextResponse.json(
      { error: "link_error", message: error instanceof Error ? error.message : "紐づけに失敗しました。" },
      { status: 500 }
    );
  }
}
