import { SpotDetailClient } from "@/components/spots/spot-detail-client";

export default async function SpotDetailPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <div className="shell space-y-8">
      <SpotDetailClient spotId={spotId} />
    </div>
  );
}
