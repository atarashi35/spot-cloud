import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getMembershipBySubscriptionId, upsertMembership } from "@/lib/server/memberships";
import { stripe } from "@/lib/stripe/config";
import { MembershipStatus, PlanAmount } from "@/lib/types";

function mapSubscriptionStatusToMembershipStatus(
  status: Stripe.Subscription.Status
): MembershipStatus {
  switch (status) {
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

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;

  if (typeof subscription === "string") {
    return subscription;
  }

  if (subscription && "id" in subscription) {
    return subscription.id;
  }

  return "";
}

async function updateMembershipStatusBySubscriptionId(
  subscriptionId: string,
  status: MembershipStatus
) {
  if (!subscriptionId) {
    return { received: true, skipped: "missing_subscription_id" } as const;
  }

  const membership = await getMembershipBySubscriptionId(subscriptionId);

  if (!membership) {
    return { received: true, skipped: "membership_not_found" } as const;
  }

  await upsertMembership({
    ...membership,
    status
  });

  return { received: true } as const;
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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata ?? {};

      if (!metadata.uid || !metadata.spotId || !metadata.spotName || !metadata.planAmount) {
        return NextResponse.json({ received: true, skipped: "missing_metadata" });
      }

      await upsertMembership({
        uid: metadata.uid,
        spotId: metadata.spotId,
        spotName: metadata.spotName,
        planAmount: Number(metadata.planAmount) as PlanAmount,
        status: "active",
        stripeCustomerId: String(session.customer ?? ""),
        stripeSubscriptionId: String(session.subscription ?? "")
      });

      return NextResponse.json({ received: true, type: event.type });
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const result = await updateMembershipStatusBySubscriptionId(
        subscription.id,
        mapSubscriptionStatusToMembershipStatus(subscription.status)
      );

      return NextResponse.json({ ...result, type: event.type });
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const result = await updateMembershipStatusBySubscriptionId(
        getSubscriptionIdFromInvoice(invoice),
        "active"
      );

      return NextResponse.json({ ...result, type: event.type });
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const result = await updateMembershipStatusBySubscriptionId(
        getSubscriptionIdFromInvoice(invoice),
        "past_due"
      );

      return NextResponse.json({ ...result, type: event.type });
    }

    if (event.type === "invoice.voided" || event.type === "invoice.marked_uncollectible") {
      const invoice = event.data.object as Stripe.Invoice;
      const result = await updateMembershipStatusBySubscriptionId(
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
