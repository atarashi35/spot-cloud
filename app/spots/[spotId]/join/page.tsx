import { JoinPageClient } from "@/components/spots/join-page-client";
import { defaultPlanAmount, isSignupPlan } from "@/lib/types";

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
