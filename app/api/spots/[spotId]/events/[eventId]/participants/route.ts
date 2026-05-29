import { NextRequest, NextResponse } from "next/server";
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
