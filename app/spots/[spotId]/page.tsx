import { Suspense } from "react";
import type { Metadata } from "next";
import { SpotDetailClient } from "@/components/spots/spot-detail-client";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { SpotDetailSkeleton } from "@/components/ui/skeleton";

export async function generateMetadata({
  params
}: {
  params: Promise<{ spotId: string }>;
}): Promise<Metadata> {
  const { spotId } = await params;
  const spot = await getSpotFromFirestore(spotId).catch(() => null);
  if (!spot) return { title: "SPOT" };

  const title = spot.name;
  const description = spot.shortDescription || spot.description.slice(0, 100);
  const image = spot.coverImageUrl ?? "/og-image.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}

export default async function SpotDetailPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <div className="shell space-y-8">
      <Suspense fallback={<SpotDetailSkeleton />}>
        <SpotDetailClient spotId={spotId} />
      </Suspense>
    </div>
  );
}
