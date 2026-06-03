import { getAdminDb } from "@/lib/firebase/admin";
import { toShortDescription } from "@/lib/utils";

export type SpotMetadataRecord = {
  name: string;
  description: string;
  shortDescription: string;
  coverImageUrl?: string;
};

function mapSpotMetadata(data: Record<string, unknown>): SpotMetadataRecord {
  const description = String(data.description ?? "");
  const shortDescription = String(data.shortDescription ?? toShortDescription(description));
  const coverImageUrl =
    typeof data.coverImageUrl === "string" && data.coverImageUrl ? data.coverImageUrl : undefined;

  return {
    name: String(data.name ?? ""),
    description,
    shortDescription,
    coverImageUrl
  };
}

export async function getSpotMetadataById(spotId: string): Promise<SpotMetadataRecord | null> {
  const snapshot = await getAdminDb().doc(`spots/${spotId}`).get();
  return snapshot.exists ? mapSpotMetadata(snapshot.data() ?? {}) : null;
}
