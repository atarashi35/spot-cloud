import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { reconcileMembershipsByEmail, repairMissingMemberDocs } from "@/lib/server/memberships";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(
      authorization.slice("Bearer ".length)
    );
    const email = decoded.email?.trim() ?? "";

    if (!email) {
      return NextResponse.json(
        { error: "missing_email", message: "メールアドレスが確認できませんでした。" },
        { status: 400 }
      );
    }

    const [reconcileResult, repairResult] = await Promise.all([
      reconcileMembershipsByEmail(decoded.uid, email),
      repairMissingMemberDocs(decoded.uid)
    ]);
    return NextResponse.json({ ok: true, ...reconcileResult, repairedCount: repairResult.repairedCount });
  } catch (error) {
    return NextResponse.json(
      {
        error: "claim_memberships_failed",
        message:
          error instanceof Error ? error.message : "購入情報の引き継ぎに失敗しました。"
      },
      { status: 500 }
    );
  }
}
