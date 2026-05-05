import type { MetadataRoute } from "next";
import {
  getAllCategories,
  getAllPosts,
  getAllTags,
  getArchive,
} from "@/lib/data/mock-posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/posts`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/categories`, lastModified: now, priority: 0.6 },
    { url: `${SITE_URL}/tags`, lastModified: now, priority: 0.6 },
  ];

  const postEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = getAllCategories().map(
    (c) => ({
      url: `${SITE_URL}/categories/${c.slug}`,
      lastModified: now,
      priority: 0.5,
    }),
  );

  const tagEntries: MetadataRoute.Sitemap = getAllTags().map((tag) => ({
    url: `${SITE_URL}/tags/${tag.slug}`,
    lastModified: now,
    priority: 0.4,
  }));

  const archiveEntries: MetadataRoute.Sitemap = getArchive().flatMap(
    (entry) =>
      entry.months.map((m) => ({
        url: `${SITE_URL}/archive/${entry.year}/${String(m.month).padStart(2, "0")}`,
        lastModified: now,
        priority: 0.3,
      })),
  );

  return [
    ...staticEntries,
    ...postEntries,
    ...categoryEntries,
    ...tagEntries,
    ...archiveEntries,
  ];
}
