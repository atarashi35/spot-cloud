import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { redeemEventEmailInvite } from "@/lib/server/events";
import { sendEventWaitlisted } from "@/lib/server/mailer";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string; eventId: string; inviteId: string }> }
) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const { spotId, eventId, inviteId } = await params;
    const decodedToken = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    const body = (await request.json().catch(() => ({}))) as {
      plusOneCount?: unknown;
      answers?: unknown;
    };
    const plusOneCount = Math.max(0, Math.min(10, Number(body.plusOneCount ?? 0) || 0));
    const answers =
      body.answers && typeof body.answers === "object" ? (body.answers as Record<string, string>) : {};

    const participant = await redeemEventEmailInvite(
      spotId,
      eventId,
      inviteId,
      {
        uid: decodedToken.uid,
        displayName: decodedToken.name ?? "",
        email: decodedToken.email ?? ""
      },
      { plusOneCount, answers }
    );

    if (participant.status === "waitlisted") {
      const db = getAdminDb();
      const [spotSnap, eventSnap] = await Promise.all([
        db.doc(`spots/${spotId}`).get(),
        db.doc(`spots/${spotId}/events/${eventId}`).get()
      ]);
      void sendEventWaitlisted({
        participant,
        spotName: String(spotSnap.data()?.name ?? ""),
        eventTitle: String(eventSnap.data()?.title ?? "")
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, status: participant.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "redeem_error";
    const status = message === "invite_not_found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
