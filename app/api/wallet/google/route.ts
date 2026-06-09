import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { buildSocioCardData } from "@/lib/socio-card-data";
import { generateGoogleWalletUrl } from "@/lib/server/wallet-google";
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
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  let uid: string;
  let authDisplayName: string;
  let authEmail: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice("Bearer ".length));
    uid = decoded.uid;
    authDisplayName = decoded.name ?? "";
    authEmail = decoded.email ?? "";
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const [memberships, profileSnap] = await Promise.all([
      getUserMembershipsAdmin(uid),
      db.collection("users").doc(uid).get(),
    ]);

    const profile = profileSnap.exists ? profileSnap.data() ?? {} : {};
    const profileDisplayName =
      typeof profile.profileDisplayName === "string" && profile.profileDisplayName.trim()
        ? profile.profileDisplayName.trim()
        : null;

    // 優先順位: プロフィール設定名 > Google名 > メール@前 > "ソシオ"
    const displayName =
      profileDisplayName ??
      (authDisplayName.trim() || null) ??
      (authEmail.includes("@") ? authEmail.split("@")[0] : null) ??
      "ソシオ";

    const cardData = buildSocioCardData(uid, displayName, memberships);
    const walletUrl = generateGoogleWalletUrl(cardData);

    return NextResponse.json({ url: walletUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[wallet/google]", message);
    return NextResponse.json({ error: "wallet_url_generation_failed", message }, { status: 500 });
  }
}
