import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

/** イベントページの閲覧数を+1する。認証不要（クライアント側でセッションごとに1回だけ呼ぶ）。 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ spotId: string; eventId: string }> }
) {
  try {
    const { spotId, eventId } = await params;
    await getAdminDb()
      .doc(`spots/${spotId}/events/${eventId}`)
      .update({ viewCount: FieldValue.increment(1) });
    return NextResponse.json({ ok: true });
  } catch {
    // 閲覧数カウントの失敗はユーザー体験に影響させない
    return NextResponse.json({ ok: false });
  }
}
