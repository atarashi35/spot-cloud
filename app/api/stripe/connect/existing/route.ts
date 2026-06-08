import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

// オーナーが持つ他の SPOT の connected account 一覧を返す
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const body = (await request.json()) as { spotId?: string };

    if (!body.spotId) {
      return NextResponse.json({ error: "missing_spot_id" }, { status: 400 });
    }

    const decodedToken = await getAdminAuth().verifyIdToken(
      authorization.slice("Bearer ".length)
    );

    const db = getAdminDb();

    // 同じオーナーの他の SPOT で connected account が設定済みのものを取得
    const snap = await db
      .collection("spots")
      .where("ownerUid", "==", decodedToken.uid)
      .get();

    const accounts: { spotId: string; spotName: string; accountId: string }[] = [];

    snap.forEach((doc) => {
      if (doc.id === body.spotId) return; // 現在の SPOT は除外
      const data = doc.data();
      const accountId = typeof data.stripeConnectedAccountId === "string"
        ? data.stripeConnectedAccountId
        : "";
      if (accountId) {
        accounts.push({
          spotId: doc.id,
          spotName: String(data.name ?? ""),
          accountId
        });
      }
    });

    // 同じ accountId は重複排除
    const unique = Array.from(
      new Map(accounts.map((a) => [a.accountId, a])).values()
    );

    return NextResponse.json({ accounts: unique });
  } catch (error) {
    return NextResponse.json(
      { error: "existing_accounts_error", message: error instanceof Error ? error.message : "取得に失敗しました。" },
      { status: 500 }
    );
  }
}
