import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { buildSocioCardData } from "@/lib/socio-card-data";
import { generateSocioPkpass } from "@/lib/server/wallet-apple";
import type { UserMembership } from "@/lib/types";

// ─── メンバーシップをAdmin SDKで取得 ─────────────────────────────────────────

async function getUserMembershipsAdmin(uid: string): Promise<UserMembership[]> {
  const db = getAdminDb();
  const snap = await db.collection("users").doc(uid).collection("memberships").get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    const ts = d.joinedAt;
    const joinedAt =
      ts && typeof ts.toDate === "function"
        ? (ts.toDate() as Date).toISOString()
        : typeof ts === "string"
        ? ts
        : new Date().toISOString();
    return {
      spotId: doc.id,
      spotName: String(d.spotName ?? ""),
      planAmount: Number(d.planAmount ?? 500) as UserMembership["planAmount"],
      status: (d.status as UserMembership["status"]) ?? "active",
      joinedAt,
    };
  });
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Bearer トークン認証
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  let uid: string;
  let displayName: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    uid = decoded.uid;
    displayName = decoded.name ?? decoded.email ?? "SOCIO";
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  try {
    const memberships = await getUserMembershipsAdmin(uid);
    const cardData = buildSocioCardData(uid, displayName, memberships);
    const pkpass = await generateSocioPkpass(cardData);

    return new NextResponse(pkpass as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="socio-${uid.slice(0, 8)}.pkpass"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[wallet/apple]", message);
    return NextResponse.json({ error: "pkpass_generation_failed", message }, { status: 500 });
  }
}
