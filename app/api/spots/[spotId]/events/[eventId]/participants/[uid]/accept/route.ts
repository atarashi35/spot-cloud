import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { acceptEventParticipant } from "@/lib/server/events";
import { sendEventApplicationAccepted, sendEventWaitlisted } from "@/lib/server/mailer";

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

    const participant = await acceptEventParticipant(spotId, eventId, uid);
    const spotName = String(spotSnapshot.data()?.name ?? "");
    const eventTitle = String(eventSnapshot.data()?.title ?? "");

    await Promise.allSettled([
      participant.status === "accepted"
        ? sendEventApplicationAccepted({
            participant,
            spotId,
            spotName,
            eventTitle,
            eventStartAt: String(eventSnapshot.data()?.startAt ?? ""),
            eventLocation: String(eventSnapshot.data()?.location ?? "")
          })
        : sendEventWaitlisted({ participant, spotName, eventTitle })
    ]);

    return NextResponse.json({ ok: true, status: participant.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "accept_error";
    const status = message === "invalid_status_transition" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
