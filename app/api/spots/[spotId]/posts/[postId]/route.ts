import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * 投稿詳細をサーバー側で認可してから返す（Phase 2）。
 * 限定投稿の本文・添付（動画含む）を、未認可の閲覧者には一切返さない。
 * Firebase のダウンロードURLは推測不能なトークン付きのため、
 * 認可者にだけURLを渡せば実質的に保護される。
 */

function parseTs(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ spotId: string; postId: string }> }
) {
  const { spotId, postId } = await params;
  const db = getAdminDb();

  // 認証（任意）
  let uid: string | null = null;
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
      uid = decoded.uid;
    } catch { /* 未ログイン扱い */ }
  }

  const postSnap = await db.doc(`spots/${spotId}/posts/${postId}`).get();
  if (!postSnap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const data = postSnap.data()!;
  const isPublic = Boolean(data.isPublic);
  const minPlanAmount = (data.minPlanAmount === 500 || data.minPlanAmount === 1000)
    ? (data.minPlanAmount as 500 | 1000)
    : undefined;

  // 閲覧者プラン: オーナー=Infinity / 有効会員=加入額 / それ以外=0
  let viewerPlan = 0;
  let isOwner = false;
  if (uid) {
    const ownerUid = (await db.doc(`spots/${spotId}`).get()).data()?.ownerUid;
    if (ownerUid === uid) {
      isOwner = true;
      viewerPlan = Infinity;
    } else {
      const memberSnap = await db.doc(`spots/${spotId}/members/${uid}`).get();
      const status = memberSnap.data()?.status;
      if (status === "active" || status === "canceling") {
        viewerPlan = Number(memberSnap.data()?.planAmount ?? 0);
      }
    }
  }
  const isMember = isOwner || viewerPlan > 0;
  const requiredPlan = minPlanAmount ?? (isMember ? 1 : Infinity);
  const canView = isPublic || viewerPlan >= requiredPlan;

  if (!canView) {
    // 本文・添付は一切返さない
    return NextResponse.json(
      { error: "forbidden", isPublic, minPlanAmount },
      { status: 403 }
    );
  }

  const attachments = Array.isArray(data.attachments)
    ? data.attachments.filter(
        (a: { url?: unknown; type?: unknown }) =>
          typeof a.url === "string" &&
          (a.type === "image" || a.type === "pdf" || a.type === "video")
      )
    : [];

  return NextResponse.json({
    post: {
      id: postSnap.id,
      spotId,
      title: String(data.title ?? ""),
      body: String(data.body ?? ""),
      imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
      attachments,
      publishDate: String(data.publishDate ?? ""),
      isPublic,
      minPlanAmount,
      createdBy: String(data.createdBy ?? ""),
      createdAt: parseTs(data.createdAt),
      updatedAt: parseTs(data.updatedAt),
    },
  });
}
