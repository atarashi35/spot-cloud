import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { respondToEventInvitation } from "@/lib/server/events";
import { sendEventApplicationAccepted, sendEventWaitlisted } from "@/lib/server/mailer";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string; eventId: string }> }
) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const { spotId, eventId } = await params;
    const decodedToken = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    const body = (await request.json().catch(() => ({}))) as {
      decision?: string;
      plusOneCount?: unknown;
      answers?: unknown;
    };

    if (body.decision !== "accept" && body.decision !== "decline") {
      return NextResponse.json({ error: "invalid_decision" }, { status: 400 });
    }

    const plusOneCount = Math.max(0, Math.min(10, Number(body.plusOneCount ?? 0) || 0));
    const answers =
      body.answers && typeof body.answers === "object" ? (body.answers as Record<string, string>) : {};

    const participant = await respondToEventInvitation(spotId, eventId, decodedToken.uid, body.decision, {
      plusOneCount,
      answers
    });

    if (body.decision === "accept") {
      const db = getAdminDb();
      const [spotSnap, eventSnap] = await Promise.all([
        db.doc(`spots/${spotId}`).get(),
        db.doc(`spots/${spotId}/events/${eventId}`).get()
      ]);
      const spotName = String(spotSnap.data()?.name ?? "");
      const eventTitle = String(eventSnap.data()?.title ?? "");

      await Promise.allSettled([
        participant.status === "accepted"
          ? sendEventApplicationAccepted({
              participant,
              spotId,
              spotName,
              eventTitle,
              eventStartAt: String(eventSnap.data()?.startAt ?? ""),
              eventLocation: String(eventSnap.data()?.location ?? "")
            })
          : sendEventWaitlisted({ participant, spotName, eventTitle })
      ]);
    }

    return NextResponse.json({ ok: true, status: participant.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "respond_error";
    const status = message === "invalid_status_transition" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
