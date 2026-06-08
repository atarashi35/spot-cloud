import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/owner/", "/manage/", "/account/", "/admin/", "/api/"]
      }
    ],
    sitemap: "https://spotcloud.app/sitemap.xml"
  };
}
