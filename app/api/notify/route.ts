import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { notifySpotMembers } from "@/lib/server/notify";
import { NotificationType } from "@/lib/types";

type Body = {
  spotId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceId?: string;
};

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing_auth" }, { status: 401 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    const payload = (await request.json()) as Body;

    if (!payload.spotId || !payload.type || !payload.title) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // 呼び出し元がそのSPOTのオーナーであることを確認
    const spotSnap = await getAdminDb().doc(`spots/${payload.spotId}`).get();
    if (!spotSnap.exists || spotSnap.data()?.ownerUid !== decoded.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const spotName = String(spotSnap.data()?.name ?? "");

    await notifySpotMembers({
      type: payload.type,
      title: payload.title,
      body: payload.body,
      spotId: payload.spotId,
      spotName,
      resourceId: payload.resourceId
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
