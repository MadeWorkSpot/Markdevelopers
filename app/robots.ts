import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/admin/",
      },
    ],
    sitemap: process.env.PUBLIC_HOST
      ? `https://${process.env.PUBLIC_HOST}/sitemap.xml`
      : "https://markdevelopers.in/sitemap.xml",
  };
}
