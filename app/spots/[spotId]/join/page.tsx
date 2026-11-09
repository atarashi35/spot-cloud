import type { Metadata } from "next";
import { JoinPageClient } from "@/components/spots/join-page-client";
import { getSpotMetadataById } from "@/lib/server/spots";
import { defaultPlanAmount, isSignupPlan } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ spotId: string }> }): Promise<Metadata> {
  const { spotId } = await params;
  const spot = await getSpotMetadataById(spotId).catch(() => null);
  return { title: spot ? `${spot.name} のサポーター登録` : "サポーター登録" };
}

export default async function JoinPage({
  params,
  searchParams
}: {
  params: Promise<{ spotId: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const { spotId } = await params;
  const { plan } = await searchParams;

  const parsedPlan = Number(plan);
  const selectedPlan = isSignupPlan(parsedPlan) ? parsedPlan : defaultPlanAmount;

  return <JoinPageClient spotId={spotId} selectedPlan={selectedPlan} />;
}
