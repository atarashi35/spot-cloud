import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { sendSociosNewPost } from "@/lib/server/mailer";
import type { PostAttachment } from "@/lib/types";

type Body = {
  title: string;
  body: string;
  attachments?: PostAttachment[];
  publishDate: string;
  isPublic: boolean;
  minPlanAmount?: 500 | 1000;
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
      attachments: payload.attachments ?? [],
      publishDate: payload.publishDate,
      isPublic: Boolean(payload.isPublic),
      minPlanAmount: payload.isPublic
        ? null
        : (payload.minPlanAmount === 500 || payload.minPlanAmount === 1000 ? payload.minPlanAmount : null),
      createdBy: decoded.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log(`[posts API] written: postId=${ref.id}`);

    // 応援会員へのメール通知（公開投稿のみ・失敗しても応答は返す）
    if (payload.isPublic) {
      void sendSociosNewPost({
        spotId,
        spotName: String(spotSnap.data()?.name ?? ""),
        postTitle: payload.title.trim(),
        postBody: payload.body ?? "",
      }).catch((e) => console.error("[posts API] mail error:", e));
    }

    return NextResponse.json({ ok: true, postId: ref.id });
  } catch (error) {
    console.error("[posts API] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
