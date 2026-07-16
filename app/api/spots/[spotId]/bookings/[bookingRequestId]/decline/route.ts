import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { declineBookingRequest } from "@/lib/server/bookings";
import { sendBookingDeclined } from "@/lib/server/mailer";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string; bookingRequestId: string }> }
) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const { spotId, bookingRequestId } = await params;
    const decodedToken = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    const body = (await request.json().catch(() => ({}))) as { declineReason?: string };

    const spotSnapshot = await getAdminDb().doc(`spots/${spotId}`).get();

    if (!spotSnapshot.exists) {
      return NextResponse.json({ error: "spot_not_found" }, { status: 404 });
    }

    if (String(spotSnapshot.data()?.ownerUid ?? "") !== decodedToken.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const booking = await declineBookingRequest(spotId, bookingRequestId, body.declineReason);

    await Promise.allSettled([sendBookingDeclined(booking)]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "decline_error", message: error instanceof Error ? error.message : "辞退処理に失敗しました。" },
      { status: 500 }
    );
  }
}
