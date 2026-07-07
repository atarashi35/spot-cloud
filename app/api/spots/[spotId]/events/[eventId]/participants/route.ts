import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { EventParticipant } from "@/lib/types";

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
          joinedAt:
            data.joinedAt && typeof data.joinedAt.toDate === "function"
              ? data.joinedAt.toDate().toISOString()
              : new Date().toISOString()
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

    const eventRef = auth.db.doc(`spots/${spotId}/events/${eventId}`);
    const participantRef = auth.db.doc(`spots/${spotId}/events/${eventId}/participants/${auth.uid}`);

    await auth.db.runTransaction(async (transaction) => {
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

      if (participantSnap.exists) {
        return;
      }

      transaction.set(participantRef, {
        uid: auth.uid,
        displayName: auth.displayName,
        email: auth.email,
        joinedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(eventRef, {
        participantCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "join_failed";
    const status = message === "event_not_found" ? 404 : message === "join_not_enabled" ? 409 : 500;
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

    await auth.db.runTransaction(async (transaction) => {
      const [eventSnap, participantSnap] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(participantRef),
      ]);

      if (!eventSnap.exists) {
        throw new Error("event_not_found");
      }

      if (!participantSnap.exists) {
        return;
      }

      transaction.delete(participantRef);
      transaction.update(eventRef, {
        participantCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "leave_failed";
    const status = message === "event_not_found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
