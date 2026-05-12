import type { MetadataRoute } from "next";
import { getAllPosts, getArchive } from "@/lib/supabase/queries/posts";
import { getAllCategories, getAllTags } from "@/lib/supabase/queries/tags";
import { getAllAlbums } from "@/lib/supabase/queries/albums";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [posts, categories, tags, archive, albums] = await Promise.all([
    getAllPosts(),
    getAllCategories(),
    getAllTags(),
    getArchive(),
    safe(() => getAllAlbums(), []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/posts`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/albums`, lastModified: now, priority: 0.7 },
    { url: `${SITE_URL}/categories`, lastModified: now, priority: 0.6 },
    { url: `${SITE_URL}/tags`, lastModified: now, priority: 0.6 },
  ];

  const albumEntries: MetadataRoute.Sitemap = albums.map((a) => ({
    url: `${SITE_URL}/albums/${a.slug}`,
    lastModified: new Date(a.updatedAt),
    priority: 0.6,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/categories/${c.slug}`,
    lastModified: now,
    priority: 0.5,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${SITE_URL}/tags/${tag.slug}`,
    lastModified: now,
    priority: 0.4,
  }));

  const archiveEntries: MetadataRoute.Sitemap = archive.flatMap((entry) =>
    entry.months.map((m) => ({
      url: `${SITE_URL}/archive/${entry.year}/${String(m.month).padStart(2, "0")}`,
      lastModified: now,
      priority: 0.3,
    })),
  );

  return [
    ...staticEntries,
    ...postEntries,
    ...albumEntries,
    ...categoryEntries,
    ...tagEntries,
    ...archiveEntries,
  ];
}
