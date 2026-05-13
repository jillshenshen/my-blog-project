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

// 一次撈所有指定 post 的留言數，回傳 Map<post_id, count>
// 若 comments 表還沒建（migration 未跑）會悄悄退回空 map，不影響列表渲染
async function fetchCommentCounts(
  postIds: string[],
): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("comments")
    .select("post_id")
    .in("post_id", postIds);

  if (error) return new Map();

  const map = new Map<string, number>();
  for (const r of (data ?? []) as { post_id: string }[]) {
    map.set(r.post_id, (map.get(r.post_id) ?? 0) + 1);
  }
  return map;
}

async function withCommentCounts(posts: Post[]): Promise<Post[]> {
  const counts = await fetchCommentCounts(posts.map((p) => p.id));
  return posts.map((p) => ({ ...p, commentCount: counts.get(p.id) ?? 0 }));
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
  return withCommentCounts((data as unknown as PostRow[]).map(mapPost));
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
  return withCommentCounts((data as unknown as PostRow[]).map(mapPost));
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
  return withCommentCounts((data as unknown as PostRow[]).map(mapPost));
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
  return withCommentCounts((data as unknown as PostRow[]).map(mapPost));
}

export async function searchPosts(query: string): Promise<Post[]> {
  const q = query.trim();
  if (!q) return [];
  const supabase = getSupabaseServer();

  // 透過 RPC 呼叫 search_posts（tsvector + ts_rank，含短查詢 ILIKE 退回）
  const { data: matched, error: e1 } = await supabase.rpc("search_posts", {
    q,
  });
  if (e1) throw e1;

  const ids: string[] = ((matched ?? []) as { id: string }[]).map((r) => r.id);
  if (ids.length === 0) return [];

  // 再撈一次拿 category / tags 關聯
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("id", ids);
  if (error) throw error;

  // 保留 RPC 回傳的排序（ts_rank desc, published_at desc）
  const orderMap = new Map<string, number>(
    ids.map((id, idx) => [id, idx] as const),
  );
  const rows = (data as unknown as PostRow[]).slice().sort(
    (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
  );
  return withCommentCounts(rows.map(mapPost));
}

export type AdjacentPost = { slug: string; title: string };
export type AdjacentPosts = {
  previous: AdjacentPost | null;
  next: AdjacentPost | null;
};

// 依 published_at 找前後文章（用「比較早」當 previous、「比較晚」當 next）
export async function getAdjacentPosts(
  currentPostId: string,
  publishedAt: string,
): Promise<AdjacentPosts> {
  const supabase = getSupabaseServer();
  const now = nowIso();

  const [prevRes, nextRes] = await Promise.all([
    supabase
      .from("posts")
      .select("slug, title")
      .eq("published", true)
      .lte("published_at", now)
      .lt("published_at", publishedAt)
      .neq("id", currentPostId)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("slug, title")
      .eq("published", true)
      .lte("published_at", now)
      .gt("published_at", publishedAt)
      .neq("id", currentPostId)
      .order("published_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (prevRes.error) throw prevRes.error;
  if (nextRes.error) throw nextRes.error;

  return {
    previous: (prevRes.data as AdjacentPost | null) ?? null,
    next: (nextRes.data as AdjacentPost | null) ?? null,
  };
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
