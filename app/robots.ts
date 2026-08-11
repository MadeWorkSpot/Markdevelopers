import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const sitemap = process.env.PUBLIC_HOST
    ? `https://${process.env.PUBLIC_HOST}/sitemap.xml`
    : "https://markdevelopers.in/sitemap.xml";

  // Staging (dev.markdevelopers.in) must never be indexed — otherwise it would
  // compete with production search rankings and expose unreleased content.
  if (process.env.ENVIRONMENT === "staging") {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/admin/",
      },
    ],
    sitemap,
  };
}
