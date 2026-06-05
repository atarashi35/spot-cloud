import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { sendSociosNewEvent } from "@/lib/server/mailer";

type Body = {
  title: string;
  description: string;
  startAt: string;
  location?: string;
  imageUrl?: string;
  isPublic: boolean;
  hasJoinButton: boolean;
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

    const spotSnap = await db.doc(`spots/${spotId}`).get();
    if (!spotSnap.exists || spotSnap.data()?.ownerUid !== decoded.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const payload = (await request.json()) as Body;
    if (!payload.title?.trim()) {
      return NextResponse.json({ error: "missing_title" }, { status: 400 });
    }

    const ref = await db.collection(`spots/${spotId}/events`).add({
      title: payload.title.trim(),
      description: payload.description ?? "",
      startAt: payload.startAt,
      location: payload.location ?? "",
      imageUrl: payload.imageUrl ?? "",
      isPublic: Boolean(payload.isPublic),
      hasJoinButton: Boolean(payload.hasJoinButton),
      createdBy: decoded.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // ソシオへのメール通知（公開イベントのみ）
    if (payload.isPublic) {
      const eventDate = payload.startAt
        ? new Date(payload.startAt).toLocaleString("ja-JP", {
            year: "numeric", month: "long", day: "numeric",
            weekday: "short", hour: "2-digit", minute: "2-digit",
          })
        : "";
      void sendSociosNewEvent({
        spotId,
        spotName: String(spotSnap.data()?.name ?? ""),
        eventId: ref.id,
        eventTitle: payload.title.trim(),
        eventDate,
        eventPlace: payload.location ?? "",
      }).catch((e) => console.error("[events API] mail error:", e));
    }

    return NextResponse.json({ ok: true, eventId: ref.id });
  } catch (error) {
    console.error("[events API] error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
