import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { setEventParticipantCheckIn } from "@/lib/server/events";

async function context(request: NextRequest, token: unknown) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("auth_required");
  const owner = await getAdminAuth().verifyIdToken(header.slice(7));
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("invalid_qr");
  const db = getAdminDb();
  const hash = createHash("sha256").update(token).digest("hex");
  const snap = await db.doc(`memberQrTokens/${hash}`).get();
  if (!snap.exists || typeof snap.data()?.expiresAt !== "number" || snap.data()!.expiresAt <= Date.now()) throw new Error("expired_qr");
  return { db, ownerUid: owner.uid, uid: String(snap.data()?.uid ?? "") };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { token?: string; spotId?: string; eventId?: string };
    const { db, ownerUid, uid } = await context(request, body.token);
    if (body.spotId && body.eventId) {
      if (body.spotId.includes("/") || body.eventId.includes("/")) throw new Error("invalid_event");
      const spot = await db.doc(`spots/${body.spotId}`).get();
      if (spot.data()?.ownerUid !== ownerUid) throw new Error("forbidden");
      await setEventParticipantCheckIn(body.spotId, body.eventId, uid, true);
      return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }
    const spots = await db.collection("spots").where("ownerUid", "==", ownerUid).get();
    const owned = new Map(spots.docs.map((spot) => [spot.id, String(spot.data().name ?? "")]));
    const records = await db.collectionGroup("participants").where("uid", "==", uid).get();
    const choices = await Promise.all(records.docs.map(async (record) => {
      const event = record.ref.parent.parent;
      const spot = event?.parent.parent;
      if (!event || !spot || event.parent.id !== "events" || spot.parent.id !== "spots" || !owned.has(spot.id) || record.data().status !== "accepted") return null;
      const snap = await event.get();
      if (!snap.exists) return null;
      return { spotId: spot.id, spotName: owned.get(spot.id), eventId: event.id, title: String(snap.data()?.title ?? ""), startAt: String(snap.data()?.startAt ?? ""), checkedIn: Boolean(record.data().checkedInAt), displayName: String(record.data().displayName ?? "") };
    }));
    return NextResponse.json({ events: choices.filter(Boolean) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "checkin_error";
    return NextResponse.json({ error: message }, { status: message === "auth_required" ? 401 : message === "forbidden" ? 403 : message === "expired_qr" || message === "invalid_qr" ? 400 : 500 });
  }
}
