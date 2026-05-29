import Stripe from "stripe";
import { PlanAmount } from "@/lib/types";

export const stripe =
  process.env.STRIPE_SECRET_KEY &&
  new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil"
  });

export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? "10");
export const CONNECT_OWNER_SHARE_PERCENT = 100 - PLATFORM_FEE_PERCENT;

const priceIdMap: Record<PlanAmount, string | undefined> = {
  100: process.env.STRIPE_PRICE_ID_100,
  300: process.env.STRIPE_PRICE_ID_300,
  500: process.env.STRIPE_PRICE_ID_500
};

export function getStripePriceId(planAmount: PlanAmount) {
  return priceIdMap[planAmount];
}
