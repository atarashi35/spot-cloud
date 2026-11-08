import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  try {
    const owner = await getAdminAuth().verifyIdToken(header.slice(7));
    const { spotId } = await params;
    const db = getAdminDb();
    const spot = await db.doc(`spots/${spotId}`).get();
    if (!spot.exists || spot.data()?.ownerUid !== owner.uid) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const followers = await db.collection(`spots/${spotId}/followers`).get();
    const profiles = followers.empty ? [] : await db.getAll(...followers.docs.map((follower) => db.doc(`users/${follower.id}`)));
    const authNames = new Map<string, string>();
    const ids = followers.docs.map((follower) => follower.id);
    for (let index = 0; index < ids.length; index += 100) {
      const batch = await getAdminAuth().getUsers(ids.slice(index, index + 100).map((uid) => ({ uid }))).catch(() => null);
      for (const user of batch?.users ?? []) authNames.set(user.uid, user.displayName ?? "");
    }
    const supporters = followers.docs.map((follower, index) => ({
      name: (typeof profiles[index]?.data()?.profileDisplayName === "string" ? profiles[index].data()!.profileDisplayName.trim() : "") || authNames.get(follower.id) || "",
      joinedAt: follower.data().followedAt?.toDate?.().toISOString() ?? "",
    })).sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
    return NextResponse.json({ supporters }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "supporters_unavailable" }, { status: 500 });
  }
}
