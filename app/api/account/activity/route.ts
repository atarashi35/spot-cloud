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
    const participants = await db.collectionGroup("participants").where("uid", "==", uid).get();
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
    return NextResponse.json({ events: events.filter((event) => event !== null).sort((a, b) => b.startAt.localeCompare(a.startAt)) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[activity]", error);
    return NextResponse.json({ error: "activity_unavailable" }, { status: 500 });
  }
}
