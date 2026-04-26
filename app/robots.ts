import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://autojobs.ma";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/profil",
          "/candidatures",
          "/offres",
          "/tableau-de-bord",
          "/talents",
          "/facturation",
          "/admin",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
