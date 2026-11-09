import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { notifySpotMembers, type ActivityType } from "@/lib/server/notify";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "missing_auth" }, { status: 401 });
  try {
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const payload = await request.json();
    const collections: Record<string, string> = { new_post: "posts", new_event: "events", new_poll: "polls", new_opportunity: "opportunities" };
    if (typeof payload.spotId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(payload.spotId) || typeof payload.resourceId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(payload.resourceId) || !Object.hasOwn(collections, payload.type)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const db = getAdminDb();
    const spot = await db.doc(`spots/${payload.spotId}`).get();
    if (!spot.exists || spot.data()?.ownerUid !== decoded.uid) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const record = await spot.ref.collection(collections[payload.type]).doc(payload.resourceId).get();
    if (!record.exists) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const data = record.data() ?? {};
    const scope = payload.type === "new_post" || payload.type === "new_event" ? (data.isPublic === true ? "public" : "paid") : data.scope;
    if (!["public", "supporters", "paid"].includes(scope)) return NextResponse.json({ error: "invalid_scope" }, { status: 400 });
    await notifySpotMembers({ type: payload.type as ActivityType, spotId: payload.spotId, spotName: String(spot.data()?.name ?? ""), resourceId: record.id, title: String(data.title ?? ""), body: String(data.body ?? data.description ?? "").slice(0, 200), scope, minPlanAmount: scope === "paid" && payload.type === "new_post" ? Number(data.minPlanAmount ?? 0) : 0 });
    return NextResponse.json({ ok: true });
  } catch (error) { console.error("[notifications] delivery failed", error); return NextResponse.json({ error: "internal_error" }, { status: 500 }); }
}
