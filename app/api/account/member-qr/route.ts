import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  try {
    const user = await getAdminAuth().verifyIdToken(header.slice(7));
    const token = randomBytes(32).toString("base64url");
    const hash = createHash("sha256").update(token).digest("hex");
    const expiresAt = Date.now() + 5 * 60_000;
    await getAdminDb().doc(`memberQrTokens/${hash}`).set({ uid: user.uid, expiresAt });
    return NextResponse.json({ token, expiresAt }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "qr_unavailable" }, { status: 500 });
  }
}
