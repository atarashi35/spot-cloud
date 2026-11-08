import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

function toIso(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate(): Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    const snap = await getAdminDb().collection(`users/${decoded.uid}/follows`).get();
    const follows = snap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          spotId: doc.id,
          spotName: String(data.spotName ?? ""),
          followedAt: toIso(data.followedAt),
        };
      })
      .sort((a, b) => b.followedAt.localeCompare(a.followedAt));

    return NextResponse.json({ follows });
  } catch {
    return NextResponse.json({ error: "follows_lookup_failed" }, { status: 500 });
  }
}
