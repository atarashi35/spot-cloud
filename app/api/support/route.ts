/**
 * POST /api/support
 * お問い合わせ内容を Firestore の inquiries コレクションに保存する
 */

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

const CATEGORIES = ["加入・解約", "支払い・請求", "ログイン・アカウント", "その他"] as const;
type Category = (typeof CATEGORIES)[number];

export async function POST(request: NextRequest) {
  try {
    // ── 認証（ログインユーザーのみ受付） ────────────────────────────────
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "auth_required" }, { status: 401 });
    }

    const decoded = await getAdminAuth()
      .verifyIdToken(authorization.slice("Bearer ".length))
      .catch(() => null);

    if (!decoded) {
      return NextResponse.json({ error: "auth_invalid" }, { status: 401 });
    }

    // ── リクエスト検証 ────────────────────────────────────────────────
    const body = (await request.json()) as {
      category?: string;
      message?: string;
      name?: string;
    };

    const category = body.category as Category | undefined;
    const message = body.message?.trim() ?? "";
    const name = body.name?.trim() ?? "";

    if (!category || !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "invalid_category" }, { status: 400 });
    }

    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: "message_too_short", message: "お問い合わせ内容は10文字以上入力してください。" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "message_too_long", message: "お問い合わせ内容は2000文字以内で入力してください。" },
        { status: 400 }
      );
    }

    // ── Firestore に保存 ─────────────────────────────────────────────
    const db = getAdminDb();
    await db.collection("inquiries").add({
      uid: decoded.uid,
      email: decoded.email ?? "",
      name,
      category,
      message,
      status: "open",
      createdAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "support_submit_failed",
        message:
          error instanceof Error ? error.message : "お問い合わせの送信に失敗しました。"
      },
      { status: 500 }
    );
  }
}
