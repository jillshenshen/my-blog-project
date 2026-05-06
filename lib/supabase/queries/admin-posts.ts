import "server-only";
import type { Post } from "@/lib/types/post";
import type { Category } from "@/lib/types/category";
import type { Tag } from "@/lib/types/tag";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type AdminPostRow = {
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

const ADMIN_POST_SELECT = `
  id, title, slug, content, excerpt, cover_image,
  published, published_at, created_at, updated_at,
  category:categories!inner(id, name, slug),
  post_tags(tag:tags(id, name, slug))
`;

function mapAdminPost(row: AdminPostRow): Post {
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

export type AdminPostFilter = "all" | "published" | "draft";

export async function getAllPostsForAdmin(
  filter: AdminPostFilter = "all",
): Promise<Post[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("posts")
    .select(ADMIN_POST_SELECT)
    .order("updated_at", { ascending: false });

  if (filter === "published") query = query.eq("published", true);
  if (filter === "draft") query = query.eq("published", false);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as AdminPostRow[]).map(mapAdminPost);
}

export async function getPostByIdForAdmin(id: string): Promise<Post | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("posts")
    .select(ADMIN_POST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapAdminPost(data as unknown as AdminPostRow);
}

export async function isSlugTaken(
  slug: string,
  excludePostId?: string,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("posts").select("id").eq("slug", slug).limit(1);
  if (excludePostId) query = query.neq("id", excludePostId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).length > 0;
}
