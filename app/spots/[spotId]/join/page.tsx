import { JoinPageClient } from "@/components/spots/join-page-client";
import { planOptions } from "@/lib/types";

export default async function JoinPage({
  params,
  searchParams
}: {
  params: Promise<{ spotId: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const { spotId } = await params;
  const { plan } = await searchParams;

  const selectedPlan = planOptions.find((amount) => amount === Number(plan)) ?? 500;

  return <JoinPageClient spotId={spotId} selectedPlan={selectedPlan} />;
}
