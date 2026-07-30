import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

/** 招待ランディングページ用の公開情報取得（認証不要、inviteIdがそのままアクセストークン）。 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ spotId: string; eventId: string; inviteId: string }> }
) {
  try {
    const { spotId, eventId, inviteId } = await params;
    const db = getAdminDb();

    const [spotSnap, eventSnap, inviteSnap] = await Promise.all([
      db.doc(`spots/${spotId}`).get(),
      db.doc(`spots/${spotId}/events/${eventId}`).get(),
      db.doc(`spots/${spotId}/events/${eventId}/emailInvites/${inviteId}`).get()
    ]);

    if (!spotSnap.exists || !eventSnap.exists || !inviteSnap.exists) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      spotName: String(spotSnap.data()?.name ?? ""),
      eventTitle: String(eventSnap.data()?.title ?? ""),
      eventStartAt: String(eventSnap.data()?.startAt ?? ""),
      eventEndAt: typeof eventSnap.data()?.endAt === "string" ? eventSnap.data()?.endAt : undefined,
      eventLocation: String(eventSnap.data()?.location ?? ""),
      eventDescription: String(eventSnap.data()?.description ?? ""),
      registrationQuestions: Array.isArray(eventSnap.data()?.registrationQuestions)
        ? (eventSnap.data()?.registrationQuestions as unknown[]).filter((q): q is string => typeof q === "string" && q.trim() !== "")
        : [],
      invitedEmail: String(inviteSnap.data()?.email ?? ""),
      status: inviteSnap.data()?.status === "redeemed" ? "redeemed" : "sent"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "invite_lookup_failed", message: error instanceof Error ? error.message : "招待情報の取得に失敗しました。" },
      { status: 500 }
    );
  }
}
