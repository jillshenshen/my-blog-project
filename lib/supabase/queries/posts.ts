import "server-only";
import type { Post } from "@/lib/types/post";
import type { Category } from "@/lib/types/category";
import type { Tag } from "@/lib/types/tag";
import { getSupabaseServer } from "@/lib/supabase/server";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category: Pick<Category, "id" | "name" | "slug">;
  post_tags: { tag: Pick<Tag, "id" | "name" | "slug"> }[];
};

const POST_SELECT = `
  id, title, slug, content, excerpt, cover_image,
  published, published_at, created_at, updated_at,
  category:categories!inner(id, name, slug),
  post_tags(tag:tags(id, name, slug))
`;

// 公開查詢一律過濾「已發布」且「published_at <= 現在」
// → 排程文章（published=true 但 published_at 在未來）會被隱藏
function nowIso() {
  return new Date().toISOString();
}

function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt ?? "",
    coverImage: row.cover_image ?? "",
    published: row.published,
    publishedAt: row.published_at ?? row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category,
    tags: row.post_tags.map((pt) => pt.tag),
  };
}

export async function getAllPosts(): Promise<Post[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("published", true)
    .lte("published_at", nowIso())
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as PostRow[]).map(mapPost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("published", true)
    .lte("published_at", nowIso())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapPost(data as unknown as PostRow);
}

export async function getRecentPosts(limit = 5): Promise<Post[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("published", true)
    .lte("published_at", nowIso())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as unknown as PostRow[]).map(mapPost);
}

export async function getPostsByCategory(
  categorySlug: string,
): Promise<Post[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("category.slug", categorySlug)
    .eq("published", true)
    .lte("published_at", nowIso())
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as PostRow[]).map(mapPost);
}

export async function getPostsByTag(tagSlug: string): Promise<Post[]> {
  const supabase = getSupabaseServer();
  // 用 inner join 過濾出有特定 tag 的 post，再回頭撈完整 post 資料
  const { data: matched, error: e1 } = await supabase
    .from("posts")
    .select("id, post_tags!inner(tag:tags!inner(slug))")
    .eq("post_tags.tag.slug", tagSlug)
    .eq("published", true)
    .lte("published_at", nowIso());

  if (e1) throw e1;
  const ids = (matched ?? []).map((row) => (row as { id: string }).id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("id", ids)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as PostRow[]).map(mapPost);
}

export async function getPostsByYearMonth(
  year: number,
  month: number,
): Promise<Post[]> {
  const supabase = getSupabaseServer();
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const end = new Date(Date.UTC(year, month, 1)).toISOString();

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("published", true)
    .gte("published_at", start)
    .lt("published_at", end)
    .lte("published_at", nowIso())
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as PostRow[]).map(mapPost);
}

export async function searchPosts(query: string): Promise<Post[]> {
  const q = query.trim();
  if (!q) return [];
  const supabase = getSupabaseServer();
  const pattern = `%${q}%`;

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("published", true)
    .lte("published_at", nowIso())
    .or(
      `title.ilike.${pattern},excerpt.ilike.${pattern},content.ilike.${pattern}`,
    )
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as PostRow[]).map(mapPost);
}

export type ArchiveMonthEntry = { month: number; count: number };
export type ArchiveEntry = {
  year: number;
  count: number;
  months: ArchiveMonthEntry[];
};

export async function getArchive(): Promise<ArchiveEntry[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("published_at")
    .eq("published", true)
    .lte("published_at", nowIso())
    .order("published_at", { ascending: false });

  if (error) throw error;

  const yearMap = new Map<number, Map<number, number>>();
  for (const row of data ?? []) {
    const at = (row as { published_at: string | null }).published_at;
    if (!at) continue;
    const d = new Date(at);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const monthMap = yearMap.get(year)!;
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
  }

  return Array.from(yearMap.entries())
    .map(([year, monthMap]) => {
      const months = Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => b.month - a.month);
      const count = months.reduce((sum, m) => sum + m.count, 0);
      return { year, count, months };
    })
    .sort((a, b) => b.year - a.year);
}
