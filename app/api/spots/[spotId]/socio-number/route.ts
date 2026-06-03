import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ spotId: string }> }) {
  const { spotId } = await params;

  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.replace("Bearer ", "");
  if (!idToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const snapshot = await db
    .collection(`spots/${spotId}/members`)
    .orderBy("joinedAt", "asc")
    .get();

  const index = snapshot.docs.findIndex((d) => d.id === uid);
  const number = index === -1 ? null : index + 1;

  return NextResponse.json({ number });
}
