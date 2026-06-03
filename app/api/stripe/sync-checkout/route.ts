/**
 * POST /api/stripe/sync-checkout
 *
 * Webhook に依存せず、Stripe Checkout セッションを直接取得して
 * Firestore のメンバーシップを作成・更新するフォールバック API。
 *
 * Webhook が届けば同じ処理が行われるため冪等（二重書き込み安全）。
 * ローカル開発で Stripe CLI が動いていない場合でも動作する。
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminAuth } from "@/lib/firebase/admin";
import { upsertMembership } from "@/lib/server/memberships";
import { stripe } from "@/lib/stripe/config";
import { MembershipStatus, PlanAmount, SocioAgeRange, SocioGender } from "@/lib/types";

/** Webhook ハンドラと同じロジックでサブスクリプション状態を MembershipStatus に変換 */
function deriveStatus(sub: Stripe.Subscription): MembershipStatus {
  if ((sub.status === "active" || sub.status === "trialing") && sub.cancel_at_period_end) {
    return "canceling";
  }
  switch (sub.status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    default:
      return "canceled";
  }
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  // ── 認証 ─────────────────────────────────────────────────────────
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
  const body = (await request.json()) as { sessionId?: string };
  const sessionId = body.sessionId?.trim() ?? "";

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "invalid_session_id" }, { status: 400 });
  }

  // ── Stripe セッション取得 ──────────────────────────────────────────
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"]
    });
  } catch {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  if (session.status !== "complete") {
    return NextResponse.json(
      { error: "session_not_complete", status: session.status },
      { status: 400 }
    );
  }

  const metadata = session.metadata ?? {};

  // UID がセッションの UID と一致することを確認（なりすまし防止）
  if (metadata.uid && metadata.uid !== decoded.uid) {
    return NextResponse.json({ error: "uid_mismatch" }, { status: 403 });
  }

  if (!metadata.spotId || !metadata.spotName || !metadata.planAmount) {
    return NextResponse.json(
      { error: "missing_metadata", detail: "spotId / spotName / planAmount が不足" },
      { status: 400 }
    );
  }

  const subscription =
    session.subscription instanceof Object
      ? (session.subscription as Stripe.Subscription)
      : null;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : subscription?.id ?? "";

  const buyerName =
    session.customer_details?.name ?? metadata.displayName ?? "";
  const buyerEmail =
    session.customer_details?.email ?? decoded.email ?? metadata.email ?? "";

  // サブスクリプションの実態からステータスを導出（Webhook と同じロジック）
  // "active" 固定にすると cancel_at_period_end や past_due を上書きしてしまう
  const membershipStatus: MembershipStatus = subscription
    ? deriveStatus(subscription)
    : "active"; // サブスクリプション未取得の場合のみフォールバック

  await upsertMembership({
    uid: decoded.uid,
    displayName: buyerName,
    email: buyerEmail,
    affiliation: String(metadata.affiliation ?? ""),
    ageRange: (metadata.ageRange ?? "") as SocioAgeRange,
    gender: (metadata.gender ?? "") as SocioGender,
    spotId: metadata.spotId,
    spotName: metadata.spotName,
    planAmount: Number(metadata.planAmount) as PlanAmount,
    status: membershipStatus,
    stripeCustomerId: String(session.customer ?? ""),
    stripeSubscriptionId: subscriptionId
  });

  return NextResponse.json({ ok: true, spotId: metadata.spotId });
}
