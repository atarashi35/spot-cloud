import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { promoteFromWaitlist } from "@/lib/server/events";
import { EventParticipant, EventParticipantStatus } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string; eventId: string }> }
) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const decodedToken = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    const { spotId, eventId } = await params;
    const db = getAdminDb();
    const spotSnapshot = await db.doc(`spots/${spotId}`).get();

    if (!spotSnapshot.exists) {
      return NextResponse.json({ error: "spot_not_found" }, { status: 404 });
    }

    const ownerUid = String(spotSnapshot.data()?.ownerUid ?? "");

    if (decodedToken.uid !== ownerUid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const snapshot = await db.collection(`spots/${spotId}/events/${eventId}/participants`).get();
    const participants = await Promise.all(
      snapshot.docs.map(async (item) => {
        const data = item.data();

        let displayName =
          typeof data.displayName === "string" && data.displayName ? data.displayName : undefined;
        let email = typeof data.email === "string" && data.email ? data.email : undefined;

        if (!displayName || !email) {
          try {
            const authUser = await getAdminAuth().getUser(String(data.uid ?? item.id));
            displayName ||= authUser.displayName ?? undefined;
            email ||= authUser.email ?? undefined;
          } catch {
            // Keep fallback values if Auth user lookup fails.
          }
        }

        return {
          uid: String(data.uid ?? item.id),
          displayName,
          email,
          status: (data.status as EventParticipant["status"]) ?? "accepted",
          joinedAt:
            data.joinedAt && typeof data.joinedAt.toDate === "function"
              ? data.joinedAt.toDate().toISOString()
              : new Date().toISOString(),
          plusOneCount: typeof data.plusOneCount === "number" && data.plusOneCount > 0 ? data.plusOneCount : undefined,
          answers: data.answers && typeof data.answers === "object" ? (data.answers as Record<string, string>) : undefined,
          checkedInAt:
            data.checkedInAt && typeof data.checkedInAt.toDate === "function"
              ? data.checkedInAt.toDate().toISOString()
              : undefined
        } satisfies EventParticipant;
      })
    );

    return NextResponse.json({ participants });
  } catch (error) {
    return NextResponse.json(
      {
        error: "participants_lookup_failed",
        message: error instanceof Error ? error.message : "イベント参加者を取得できませんでした。"
      },
      { status: 500 }
    );
  }
}

async function requireActiveMember(request: NextRequest, spotId: string) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "missing_auth" }, { status: 401 }) };
  }

  const decodedToken = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
  const db = getAdminDb();
  const memberSnap = await db.doc(`spots/${spotId}/members/${decodedToken.uid}`).get();
  const status = memberSnap.data()?.status;

  if (status !== "active" && status !== "canceling") {
    return { error: NextResponse.json({ error: "membership_required" }, { status: 403 }) };
  }

  return { db, uid: decodedToken.uid, displayName: decodedToken.name ?? "", email: decodedToken.email ?? "" };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string; eventId: string }> }
) {
  try {
    const { spotId, eventId } = await params;
    const auth = await requireActiveMember(request, spotId);
    if ("error" in auth) return auth.error;

    const body = (await request.json().catch(() => ({}))) as {
      plusOneCount?: unknown;
      answers?: unknown;
    };
    const plusOneCount = Math.max(0, Math.min(10, Number(body.plusOneCount ?? 0) || 0));
    const answers =
      body.answers && typeof body.answers === "object" ? (body.answers as Record<string, string>) : {};

    const eventRef = auth.db.doc(`spots/${spotId}/events/${eventId}`);
    const participantRef = auth.db.doc(`spots/${spotId}/events/${eventId}/participants/${auth.uid}`);

    const result = await auth.db.runTransaction(async (transaction) => {
      const [eventSnap, participantSnap] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(participantRef),
      ]);

      if (!eventSnap.exists) {
        throw new Error("event_not_found");
      }

      if (!eventSnap.data()?.hasJoinButton) {
        throw new Error("join_not_enabled");
      }

      const participationMode = eventSnap.data()?.participationMode ?? "open";

      if (participationMode === "invitation") {
        throw new Error("invitation_only");
      }

      if (participantSnap.exists) {
        return { applied: false, status: participantSnap.data()?.status ?? "accepted", event: eventSnap.data() };
      }

      const seats = 1 + plusOneCount;
      const capacity = Number(eventSnap.data()?.capacity ?? 0) || undefined;
      const participantCount = Number(eventSnap.data()?.participantCount ?? 0);
      const hasRoom = !capacity || participantCount + seats <= capacity;

      const status: EventParticipantStatus =
        participationMode === "application" ? "pending" : hasRoom ? "accepted" : "waitlisted";

      transaction.set(participantRef, {
        uid: auth.uid,
        displayName: auth.displayName,
        email: auth.email,
        status,
        plusOneCount,
        answers,
        joinedAt: FieldValue.serverTimestamp(),
      });

      if (status === "accepted") {
        transaction.update(eventRef, {
          participantCount: FieldValue.increment(seats),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return { applied: true, status, event: eventSnap.data() };
    });

    if (result.applied && result.status === "pending") {
      const { sendEventApplicationReceived } = await import("@/lib/server/mailer");
      void sendEventApplicationReceived({
        spotId,
        eventTitle: String(result.event?.title ?? ""),
        applicantName: auth.displayName || auth.email || "応援会員"
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "join_failed";
    const status =
      message === "event_not_found" ? 404 : message === "join_not_enabled" || message === "invitation_only" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string; eventId: string }> }
) {
  try {
    const { spotId, eventId } = await params;
    const auth = await requireActiveMember(request, spotId);
    if ("error" in auth) return auth.error;

    const eventRef = auth.db.doc(`spots/${spotId}/events/${eventId}`);
    const participantRef = auth.db.doc(`spots/${spotId}/events/${eventId}/participants/${auth.uid}`);

    const wasAccepted = await auth.db.runTransaction(async (transaction) => {
      const [eventSnap, participantSnap] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(participantRef),
      ]);

      if (!eventSnap.exists) {
        throw new Error("event_not_found");
      }

      if (!participantSnap.exists) {
        return false;
      }

      const data = participantSnap.data();
      const accepted = (data?.status ?? "accepted") === "accepted";
      const seats = 1 + Number(data?.plusOneCount ?? 0);

      transaction.delete(participantRef);
      if (accepted) {
        transaction.update(eventRef, {
          participantCount: FieldValue.increment(-seats),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return accepted;
    });

    if (wasAccepted) {
      void promoteFromWaitlist(spotId, eventId)
        .then(async ({ promoted }) => {
          if (promoted.length === 0) return;
          const [{ sendEventApplicationAccepted }, spotSnap, eventSnap] = await Promise.all([
            import("@/lib/server/mailer"),
            getAdminDb().doc(`spots/${spotId}`).get(),
            getAdminDb().doc(`spots/${spotId}/events/${eventId}`).get()
          ]);
          const spotName = String(spotSnap.data()?.name ?? "");
          const eventTitle = String(eventSnap.data()?.title ?? "");
          const eventStartAt = String(eventSnap.data()?.startAt ?? "");
          const eventLocation = String(eventSnap.data()?.location ?? "");
          await Promise.allSettled(
            promoted.map((participant) =>
              sendEventApplicationAccepted({ participant, spotId, spotName, eventTitle, eventStartAt, eventLocation })
            )
          );
        })
        .catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "leave_failed";
    const status = message === "event_not_found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
