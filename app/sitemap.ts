import type { MetadataRoute } from "next";
import { readData } from "@/lib/data";
import { slugify } from "@/lib/slugify";

const BASE_URL = process.env.PUBLIC_HOST
  ? `https://${process.env.PUBLIC_HOST}`
  : "https://markdevelopers.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/projects`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/gallery`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  let projectPages: MetadataRoute.Sitemap = [];
  try {
    const data = await readData<{
      projects: { title: string }[];
    }>("projects");
    projectPages = (data.projects ?? []).map((p) => ({
      url: `${BASE_URL}/projects/${slugify(p.title)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    // ignore — fallback to static pages only
  }

  return [...staticPages, ...projectPages];
}
