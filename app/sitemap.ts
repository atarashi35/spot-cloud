import type { MetadataRoute } from "next";
import { getAdminDb } from "@/lib/firebase/admin";

const BASE_URL = "https://spotcloud.app";

const staticRoutes: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
  { url: `${BASE_URL}/spots`, changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE_URL}/law`, changeFrequency: "yearly", priority: 0.3 }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("spots")
      .where("isPublished", "==", true)
      .get();

    const spotRoutes: MetadataRoute.Sitemap = snap.docs.map((doc) => {
      const data = doc.data();
      const updatedAt: Date =
        data.updatedAt?.toDate?.() ?? data.createdAt?.toDate?.() ?? new Date();
      return {
        url: `${BASE_URL}/spots/${doc.id}`,
        lastModified: updatedAt,
        changeFrequency: "weekly",
        priority: 0.8
      };
    });

    return [...staticRoutes, ...spotRoutes];
  } catch {
    return staticRoutes;
  }
}
