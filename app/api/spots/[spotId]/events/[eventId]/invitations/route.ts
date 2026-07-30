import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { createEventEmailInvites, inviteEventParticipants, listEventEmailInvites } from "@/lib/server/events";
import { sendEventEmailInvitation, sendEventInvitation } from "@/lib/server/mailer";

async function requireOwnerInvitationEvent(
  request: NextRequest,
  spotId: string,
  eventId: string
) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "missing_auth" }, { status: 401 }) };
  }

  const decodedToken = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
  const db = getAdminDb();
  const [spotSnapshot, eventSnapshot] = await Promise.all([
    db.doc(`spots/${spotId}`).get(),
    db.doc(`spots/${spotId}/events/${eventId}`).get()
  ]);

  if (!spotSnapshot.exists || !eventSnapshot.exists) {
    return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  }

  if (String(spotSnapshot.data()?.ownerUid ?? "") !== decodedToken.uid) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }

  return { db, spotSnapshot, eventSnapshot };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string; eventId: string }> }
) {
  try {
    const { spotId, eventId } = await params;
    const auth = await requireOwnerInvitationEvent(request, spotId, eventId);
    if ("error" in auth) return auth.error;

    const emailInvites = await listEventEmailInvites(spotId, eventId);
    return NextResponse.json({ emailInvites });
  } catch (error) {
    return NextResponse.json(
      { error: "list_error", message: error instanceof Error ? error.message : "取得に失敗しました。" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string; eventId: string }> }
) {
  try {
    const { spotId, eventId } = await params;
    const auth = await requireOwnerInvitationEvent(request, spotId, eventId);
    if ("error" in auth) return auth.error;
    const { spotSnapshot, eventSnapshot } = auth;

    const body = (await request.json().catch(() => ({}))) as {
      uids?: unknown;
      emails?: unknown;
    };

    const uids = Array.isArray(body.uids) ? body.uids.filter((v): v is string => typeof v === "string") : [];
    const emails = Array.isArray(body.emails)
      ? body.emails.filter(
          (v): v is { email: string; displayName?: string } =>
            typeof v === "object" && v !== null && typeof (v as { email?: unknown }).email === "string"
        )
      : [];

    if (uids.length === 0 && emails.length === 0) {
      return NextResponse.json({ error: "invalid_invitees" }, { status: 400 });
    }

    if (eventSnapshot.data()?.participationMode !== "invitation") {
      return NextResponse.json({ error: "not_invitation_mode" }, { status: 409 });
    }

    const spotName = String(spotSnapshot.data()?.name ?? "");
    const eventTitle = String(eventSnapshot.data()?.title ?? "");
    const eventStartAt = String(eventSnapshot.data()?.startAt ?? "");
    const eventLocation = String(eventSnapshot.data()?.location ?? "");

    const [memberResult, emailResult] = await Promise.all([
      uids.length > 0
        ? inviteEventParticipants(spotId, eventId, uids)
        : Promise.resolve({ invited: [], skipped: [] as string[] }),
      emails.length > 0
        ? createEventEmailInvites(spotId, eventId, emails)
        : Promise.resolve({ created: [], skipped: [] as string[] })
    ]);

    await Promise.allSettled([
      ...memberResult.invited
        .filter((participant) => participant.email)
        .map((participant) =>
          sendEventInvitation({ participant, spotId, eventId, spotName, eventTitle, eventStartAt, eventLocation })
        ),
      ...emailResult.created.map((invite) =>
        sendEventEmailInvitation({ invite, spotId, eventId, spotName, eventTitle, eventStartAt, eventLocation })
      )
    ]);

    return NextResponse.json({
      ok: true,
      invitedMemberCount: memberResult.invited.length,
      skippedMembers: memberResult.skipped,
      invitedEmailCount: emailResult.created.length,
      skippedEmails: emailResult.skipped
    });
  } catch (error) {
    return NextResponse.json(
      { error: "invite_error", message: error instanceof Error ? error.message : "招待の送信に失敗しました。" },
      { status: 500 }
    );
  }
}
