import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

type Body = {
  title: string;
  body: string;
  imageUrl?: string;
  publishDate: string;
  isPublic: boolean;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> }
) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing_auth" }, { status: 401 });
  }

  try {
    const { spotId } = await params;
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    const db = getAdminDb();

    console.log(`[posts API] spotId=${spotId} uid=${decoded.uid}`);

    // オーナー確認
    const spotSnap = await db.doc(`spots/${spotId}`).get();
    const ownerUid = spotSnap.data()?.ownerUid;
    console.log(`[posts API] spot.ownerUid=${ownerUid} exists=${spotSnap.exists}`);

    if (!spotSnap.exists || ownerUid !== decoded.uid) {
      console.log(`[posts API] forbidden: ownerUid=${ownerUid} !== uid=${decoded.uid}`);
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const payload = (await request.json()) as Body;
    if (!payload.title?.trim()) {
      return NextResponse.json({ error: "missing_title" }, { status: 400 });
    }

    console.log(`[posts API] writing post: title="${payload.title}"`);
    const ref = await db.collection(`spots/${spotId}/posts`).add({
      title: payload.title.trim(),
      body: payload.body ?? "",
      imageUrl: payload.imageUrl ?? "",
      publishDate: payload.publishDate,
      isPublic: Boolean(payload.isPublic),
      createdBy: decoded.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log(`[posts API] written: postId=${ref.id}`);
    return NextResponse.json({ ok: true, postId: ref.id });
  } catch (error) {
    console.error("[posts API] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
