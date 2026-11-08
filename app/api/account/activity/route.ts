import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  let uid: string;
  try {
    uid = (await getAdminAuth().verifyIdToken(authorization.slice(7))).uid;
  } catch {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const [participants, historySnap, followsSnap, membershipsSnap] = await Promise.all([
      db.collectionGroup("participants").where("uid", "==", uid).get(),
      db.collection(`users/${uid}/supportHistory`).get(),
      db.collection(`users/${uid}/follows`).get(),
      db.collection(`users/${uid}/memberships`).get(),
    ]);
    const events = await Promise.all(participants.docs.map(async (participant) => {
      const eventRef = participant.ref.parent.parent;
      const spotRef = eventRef?.parent.parent;
      if (!eventRef || !spotRef || eventRef.parent.id !== "events" || spotRef.parent.id !== "spots") return null;
      const [event, spot] = await Promise.all([eventRef.get(), spotRef.get()]);
      if (!event.exists || !spot.exists) return null;
      const data = participant.data();
      if (data.status !== "accepted") return null;
      const start = event.data()?.startAt;
      return {
        spotId: spot.id, spotName: String(spot.data()?.name ?? ""), eventId: event.id,
        title: String(event.data()?.title ?? ""),
        startAt: typeof start === "string" ? start : start?.toDate?.().toISOString() ?? "",
        checkedInAt: data.checkedInAt?.toDate?.().toISOString() ?? null,
      };
    }));
    const iso = (value: unknown) => typeof value === "string" ? value : (value as { toDate?: () => Date } | null)?.toDate?.().toISOString() ?? "";
    const history = historySnap.docs.map((doc) => ({ id: doc.id, spotId: String(doc.data().spotId ?? ""), spotName: String(doc.data().spotName ?? ""), kind: String(doc.data().kind ?? ""), action: String(doc.data().action ?? ""), occurredAt: iso(doc.data().occurredAt) }));
    const knownStarts = new Set(history.filter((item) => item.action === "joined").map((item) => `${item.spotId}:${item.kind}`));
    for (const doc of followsSnap.docs) {
      if (!knownStarts.has(`${doc.id}:free`)) history.push({ id: `free-${doc.id}`, spotId: doc.id, spotName: String(doc.data().spotName ?? ""), kind: "free", action: "joined", occurredAt: iso(doc.data().followedAt) });
    }
    for (const doc of membershipsSnap.docs) {
      if (!knownStarts.has(`${doc.id}:monthly`)) history.push({ id: `monthly-${doc.id}`, spotId: doc.id, spotName: String(doc.data().spotName ?? ""), kind: "monthly", action: "joined", occurredAt: iso(doc.data().joinedAt) });
    }
    return NextResponse.json({ events: events.filter((event) => event !== null).sort((a, b) => b.startAt.localeCompare(a.startAt)), history: history.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[activity]", error);
    return NextResponse.json({ error: "activity_unavailable" }, { status: 500 });
  }
}
