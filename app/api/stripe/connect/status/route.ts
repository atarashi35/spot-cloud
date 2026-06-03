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

    const accountId = typeof spot.stripeConnectedAccountId === "string" ? spot.stripeConnectedAccountId : "";

    if (!accountId) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false,
        transfersEnabled: false,
        payoutsEnabled: false,
        accountId: null,
        requirementsDue: [],
        disabledReason: null,
        hasExternalAccount: false
      });
    }

    const account = await stripe.accounts.retrieve(accountId);
    const transfersCapability = account.capabilities?.transfers;
    const transfersEnabled =
      transfersCapability === "active" || Boolean(account.payouts_enabled);

    return NextResponse.json({
      connected: true,
      onboardingComplete: Boolean(account.details_submitted),
      transfersEnabled,
      payoutsEnabled: Boolean(account.payouts_enabled),
      accountId: account.id,
      requirementsDue: account.requirements?.currently_due ?? [],
      disabledReason: account.requirements?.disabled_reason ?? null,
      hasExternalAccount: Boolean(account.external_accounts?.data?.length)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "connect_status_error",
        message: error instanceof Error ? error.message : "Connect 状態を取得できませんでした。"
      },
      { status: 500 }
    );
  }
}
