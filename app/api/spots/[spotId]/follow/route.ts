import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

async function authenticate(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
}

function toIso(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate(): Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> }
) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) return NextResponse.json({ error: "auth_required" }, { status: 401 });

    const { spotId } = await params;
    const snap = await getAdminDb().doc(`users/${decoded.uid}/follows/${spotId}`).get();
    if (!snap.exists) return NextResponse.json({ follow: null });

    const data = snap.data() ?? {};
    return NextResponse.json({
      follow: {
        spotId,
        spotName: String(data.spotName ?? ""),
        followedAt: toIso(data.followedAt),
      },
    });
  } catch {
    return NextResponse.json({ error: "follow_lookup_failed" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> }
) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) return NextResponse.json({ error: "auth_required" }, { status: 401 });

    const { spotId } = await params;
    const db = getAdminDb();
    const spotRef = db.doc(`spots/${spotId}`);
    const followerRef = db.doc(`spots/${spotId}/followers/${decoded.uid}`);
    const userFollowRef = db.doc(`users/${decoded.uid}/follows/${spotId}`);
    const memberRef = db.doc(`spots/${spotId}/members/${decoded.uid}`);

    const result = await db.runTransaction(async (transaction) => {
      const [spotSnap, followerSnap, memberSnap] = await Promise.all([
        transaction.get(spotRef),
        transaction.get(followerRef),
        transaction.get(memberRef),
      ]);

      if (!spotSnap.exists || spotSnap.data()?.isPublished !== true || spotSnap.data()?.isSuspended === true) {
        throw new Error("spot_not_available");
      }

      const memberStatus = String(memberSnap.data()?.status ?? "");
      if (memberStatus === "active" || memberStatus === "canceling") return "paid";
      if (followerSnap.exists) return "following";

      const spotName = String(spotSnap.data()?.name ?? "");
      const followedAt = FieldValue.serverTimestamp();
      transaction.set(followerRef, { uid: decoded.uid, followedAt });
      transaction.set(userFollowRef, { spotId, spotName, followedAt });
      transaction.set(db.collection(`users/${decoded.uid}/supportHistory`).doc(), { spotId, spotName, kind: "free", action: "joined", occurredAt: followedAt });
      transaction.update(spotRef, {
        followerCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return "following";
    });

    return NextResponse.json({ ok: true, state: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "follow_failed";
    return NextResponse.json(
      { error: message },
      { status: message === "spot_not_available" ? 404 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> }
) {
  try {
    const decoded = await authenticate(request);
    if (!decoded) return NextResponse.json({ error: "auth_required" }, { status: 401 });

    const { spotId } = await params;
    const db = getAdminDb();
    const spotRef = db.doc(`spots/${spotId}`);
    const followerRef = db.doc(`spots/${spotId}/followers/${decoded.uid}`);
    const userFollowRef = db.doc(`users/${decoded.uid}/follows/${spotId}`);

    await db.runTransaction(async (transaction) => {
      const [spotSnap, followerSnap] = await Promise.all([
        transaction.get(spotRef),
        transaction.get(followerRef),
      ]);
      if (!followerSnap.exists) return;

      transaction.delete(followerRef);
      transaction.delete(userFollowRef);
      transaction.set(db.collection(`users/${decoded.uid}/supportHistory`).doc(), { spotId, spotName: String(spotSnap.data()?.name ?? ""), kind: "free", action: "left", occurredAt: FieldValue.serverTimestamp() });
      if (spotSnap.exists) {
        const current = Number(spotSnap.data()?.followerCount ?? 0);
        transaction.update(spotRef, {
          followerCount: Math.max(0, current - 1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json({ ok: true, state: "none" });
  } catch {
    return NextResponse.json({ error: "unfollow_failed" }, { status: 500 });
  }
}
