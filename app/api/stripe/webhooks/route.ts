import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getMembershipBySubscriptionId, upsertMembership } from "@/lib/server/memberships";
import { stripe } from "@/lib/stripe/config";
import { MembershipStatus, PlanAmount, SocioAgeRange, SocioGender } from "@/lib/types";
import {
  sendSocioWelcome,
  sendSocioCanceling,
  sendPaymentFailed,
  sendOwnerNewSocio,
  sendOwnerSocioLeft,
} from "@/lib/server/mailer";
import { getAdminDb } from "@/lib/firebase/admin";

/**
 * Stripe Subscription → MembershipStatus のマッピング
 *
 * cancel_at_period_end = true の場合は "canceling" 扱い。
 * 応援会員はまだ請求中なので socioCount から除外しない。
 * 期末に subscription.deleted が飛んで "canceled" になる。
 */
function mapSubscriptionToMembershipStatus(
  subscription: Stripe.Subscription
): MembershipStatus {
  if (
    (subscription.status === "active" || subscription.status === "trialing") &&
    subscription.cancel_at_period_end
  ) {
    return "canceling";
  }

  switch (subscription.status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
    case "paused":
    default:
      return "canceled";
  }
}

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string {
  const subscription = invoice.parent?.subscription_details?.subscription;

  if (typeof subscription === "string") {
    return subscription;
  }

  if (subscription && "id" in subscription) {
    return subscription.id;
  }

  return "";
}

async function syncMembershipFromSubscription(
  subscription: Stripe.Subscription
): Promise<{ received: true; skipped?: string }> {
  const membership = await getMembershipBySubscriptionId(subscription.id);

  if (!membership) {
    return { received: true, skipped: "membership_not_found" };
  }

  await upsertMembership({
    ...membership,
    status: mapSubscriptionToMembershipStatus(subscription)
  });

  return { received: true };
}

async function syncMembershipFromSubscriptionId(
  subscriptionId: string,
  status: MembershipStatus
): Promise<{ received: true; skipped?: string }> {
  if (!subscriptionId) {
    return { received: true, skipped: "missing_subscription_id" };
  }

  const membership = await getMembershipBySubscriptionId(subscriptionId);

  if (!membership) {
    return { received: true, skipped: "membership_not_found" };
  }

  await upsertMembership({ ...membership, status });

  return { received: true };
}

export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // ─── チェックアウト完了 ────────────────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};

      if (!metadata.uid || !metadata.spotId || !metadata.spotName || !metadata.planAmount) {
        return NextResponse.json({ received: true, skipped: "missing_metadata" });
      }

      let buyerName = session.customer_details?.name ?? metadata.displayName ?? "";
      let buyerEmail = session.customer_details?.email ?? metadata.email ?? "";

      if ((!buyerName || !buyerEmail) && typeof session.customer === "string") {
        const customer = await stripe.customers.retrieve(session.customer);

        if (!("deleted" in customer)) {
          buyerName ||= customer.name ?? "";
          buyerEmail ||= customer.email ?? "";
        }
      }

      const planAmount = Number(metadata.planAmount) as PlanAmount;
      await upsertMembership({
        uid: metadata.uid,
        displayName: buyerName,
        email: buyerEmail,
        affiliation: String(metadata.affiliation ?? ""),
        ageRange: (metadata.ageRange ?? "") as SocioAgeRange,
        gender: (metadata.gender ?? "") as SocioGender,
        address: String(metadata.address ?? ""),
        spotId: metadata.spotId,
        spotName: metadata.spotName,
        planAmount,
        status: "active",
        stripeCustomerId: String(session.customer ?? ""),
        stripeSubscriptionId: String(session.subscription ?? "")
      });

      // メール通知（失敗しても webhook は成功扱い）
      const spotSnap = await getAdminDb().doc(`spots/${metadata.spotId}`).get();
      const totalSocios = Number(spotSnap.data()?.socioCount ?? 0);
      await Promise.allSettled([
        buyerEmail
          ? sendSocioWelcome({
              to: buyerEmail,
              spotName: metadata.spotName,
              spotId: metadata.spotId,
              planAmount,
              displayName: buyerName,
            })
          : Promise.resolve(),
        sendOwnerNewSocio({
          spotId: metadata.spotId,
          spotName: metadata.spotName,
          socioName: buyerName,
          socioAffiliation: String(metadata.affiliation ?? ""),
          planAmount,
          totalSocios,
        }),
      ]);

      return NextResponse.json({ received: true, type: event.type });
    }

    // ─── サブスクリプション更新・削除 ─────────────────────────────────
    //
    // subscription.updated で cancel_at_period_end=true が来たとき、
    // Stripe の status は "active" のまま → mapSubscriptionToMembershipStatus が
    // "canceling" を返す → socioCount は変えず Firestore に canceling を書く。
    //
    // subscription.deleted は期末に "canceled" で来る →
    // upsertMembership が canceling→canceled を検知して socioCount を -1 する。
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const membership = await getMembershipBySubscriptionId(subscription.id);
      const result = await syncMembershipFromSubscription(subscription);

      if (membership) {
        const newStatus = mapSubscriptionToMembershipStatus(subscription);

        // 解約予定になった
        if (newStatus === "canceling" && membership.status !== "canceling") {
          const periodEnd = subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toLocaleDateString("ja-JP")
            : "";
          await Promise.allSettled([
            membership.email
              ? sendSocioCanceling({
                  to: membership.email,
                  spotName: membership.spotName,
                  spotId: membership.spotId,
                  displayName: membership.displayName ?? "",
                  periodEnd,
                })
              : Promise.resolve(),
          ]);
        }

        // 完全解約
        if (newStatus === "canceled" && membership.status !== "canceled") {
          const spotSnap = await getAdminDb().doc(`spots/${membership.spotId}`).get();
          const totalSocios = Number(spotSnap.data()?.socioCount ?? 0);
          await Promise.allSettled([
            sendOwnerSocioLeft({
              spotId: membership.spotId,
              spotName: membership.spotName,
              socioName: membership.displayName ?? "",
              totalSocios,
            }),
          ]);
        }
      }

      return NextResponse.json({ ...result, type: event.type });
    }

    // ─── 請求成功 → active 確認 ────────────────────────────────────────
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getSubscriptionIdFromInvoice(invoice);

      if (!subscriptionId) {
        return NextResponse.json({ received: true, skipped: "missing_subscription_id" });
      }

      // 請求成功時はサブスクリプションの最新状態を取得して同期
      // （cancel_at_period_end の考慮が必要なため直接取得）
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const result = await syncMembershipFromSubscription(subscription);
      return NextResponse.json({ ...result, type: event.type });
    }

    // ─── 支払い失敗 ────────────────────────────────────────────────────
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getSubscriptionIdFromInvoice(invoice);
      const membership = await getMembershipBySubscriptionId(subscriptionId);
      const result = await syncMembershipFromSubscriptionId(subscriptionId, "past_due");

      if (membership?.email) {
        await Promise.allSettled([
          sendPaymentFailed({
            to: membership.email,
            spotName: membership.spotName,
            displayName: membership.displayName ?? "",
            portalUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://spotcloud.app"}/dashboard`,
          }),
        ]);
      }

      return NextResponse.json({ ...result, type: event.type });
    }

    // ─── 請求書無効化 ──────────────────────────────────────────────────
    if (event.type === "invoice.voided" || event.type === "invoice.marked_uncollectible") {
      const invoice = event.data.object as Stripe.Invoice;
      const result = await syncMembershipFromSubscriptionId(
        getSubscriptionIdFromInvoice(invoice),
        "canceled"
      );
      return NextResponse.json({ ...result, type: event.type });
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    return NextResponse.json(
      {
        error: "invalid_signature",
        detail: error instanceof Error ? error.message : "unknown"
      },
      { status: 400 }
    );
  }
}
