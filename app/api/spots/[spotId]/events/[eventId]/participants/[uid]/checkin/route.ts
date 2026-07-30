import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { setEventParticipantCheckIn } from "@/lib/server/events";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string; eventId: string; uid: string }> }
) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const { spotId, eventId, uid } = await params;
    const decodedToken = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    const body = (await request.json().catch(() => ({}))) as { checkedIn?: unknown };
    const checkedIn = body.checkedIn !== false;

    const spotSnapshot = await getAdminDb().doc(`spots/${spotId}`).get();

    if (!spotSnapshot.exists) {
      return NextResponse.json({ error: "spot_not_found" }, { status: 404 });
    }

    if (String(spotSnapshot.data()?.ownerUid ?? "") !== decodedToken.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const participant = await setEventParticipantCheckIn(spotId, eventId, uid, checkedIn);

    return NextResponse.json({ ok: true, checkedInAt: participant.checkedInAt ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "checkin_error";
    const status = message === "invalid_status_transition" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
