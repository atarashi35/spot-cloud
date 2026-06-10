import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

function parseTs(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  const { spotId } = await params;
  const db = getAdminDb();

  // 認証確認（任意）
  let uid: string | null = null;
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    try {
      const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
      uid = decoded.uid;
    } catch { /* 未ログインとして扱う */ }
  }

  // ソシオ or オーナー判定
  let canViewAll = false;
  if (uid) {
    const spotSnap = await db.doc(`spots/${spotId}`).get();
    const ownerUid = spotSnap.data()?.ownerUid;
    if (ownerUid === uid) {
      canViewAll = true;
    } else {
      const memberSnap = await db.doc(`spots/${spotId}/members/${uid}`).get();
      const status = memberSnap.data()?.status;
      canViewAll = status === "active" || status === "canceling";
    }
  }

  const [postsSnap, eventsSnap] = await Promise.all([
    db.collection(`spots/${spotId}/posts`).orderBy("publishDate", "desc").get(),
    db.collection(`spots/${spotId}/events`).orderBy("startAt", "asc").get(),
  ]);

  const posts = postsSnap.docs.map((d) => {
    const data = d.data();
    const isPublic = Boolean(data.isPublic);
    const masked = !isPublic && !canViewAll;
    return {
      id: d.id,
      isPublic,
      publishDate: typeof data.publishDate === "string" ? data.publishDate : "",
      title: masked ? "" : String(data.title ?? ""),
      body: masked ? "" : String(data.body ?? ""),
      imageUrl: masked ? null : (data.imageUrl || null),
      attachments: masked ? [] : (Array.isArray(data.attachments) ? data.attachments : []),
      masked,
    };
  });

  const events = eventsSnap.docs.map((d) => {
    const data = d.data();
    const isPublic = Boolean(data.isPublic);
    const masked = !isPublic && !canViewAll;
    return {
      id: d.id,
      isPublic,
      startAt: parseTs(data.startAt),
      title: masked ? "" : String(data.title ?? ""),
      description: masked ? "" : String(data.description ?? ""),
      imageUrl: masked ? null : (data.imageUrl || null),
      location: masked ? null : (data.location || null),
      hasJoinButton: masked ? false : Boolean(data.hasJoinButton),
      participantCount: masked ? 0 : Number(data.participantCount ?? 0),
      masked,
    };
  });

  return NextResponse.json({ posts, events });
}
