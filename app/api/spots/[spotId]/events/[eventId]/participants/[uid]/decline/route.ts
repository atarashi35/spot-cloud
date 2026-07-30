import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { declineEventParticipant } from "@/lib/server/events";
import { sendEventApplicationDeclined } from "@/lib/server/mailer";

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

    const db = getAdminDb();
    const [spotSnapshot, eventSnapshot] = await Promise.all([
      db.doc(`spots/${spotId}`).get(),
      db.doc(`spots/${spotId}/events/${eventId}`).get()
    ]);

    if (!spotSnapshot.exists || !eventSnapshot.exists) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (String(spotSnapshot.data()?.ownerUid ?? "") !== decodedToken.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const participant = await declineEventParticipant(spotId, eventId, uid);

    await Promise.allSettled([
      sendEventApplicationDeclined({
        participant,
        spotName: String(spotSnapshot.data()?.name ?? ""),
        eventTitle: String(eventSnapshot.data()?.title ?? "")
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "decline_error";
    const status = message === "invalid_status_transition" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
