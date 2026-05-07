"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";
import { isSlugTaken } from "@/lib/supabase/queries/admin-posts";
import { slugify } from "@/lib/utils/slugify";
import { sanitizeContentHtml } from "@/lib/utils/sanitize-html";
import { dedupeFigureImages } from "@/lib/utils/dedupe-figure-images";
import type { Tag } from "@/lib/types/tag";

async function requireAuth() {
  const supabase = await getSupabaseServerWithAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return user;
}

type PostFormFields = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  categoryId: string;
  tagIds: string[];
  published: boolean;
};

function parseForm(formData: FormData): PostFormFields {
  const title = String(formData.get("title") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  if (!slug) slug = slugify(title);

  const tagIdsRaw = String(formData.get("tagIds") ?? "");
  const tagIds = tagIdsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const rawContent = String(formData.get("content") ?? "");
  return {
    title,
    slug,
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    content: dedupeFigureImages(sanitizeContentHtml(rawContent)),
    coverImage: String(formData.get("coverImage") ?? "").trim() || null,
    categoryId: String(formData.get("categoryId") ?? ""),
    tagIds,
    published: formData.get("published") === "on",
  };
}

function validate(f: PostFormFields): string | null {
  if (!f.title) return "標題為必填";
  if (!f.slug) return "Slug 為必填（標題為空時無法自動產生）";
  if (!/^[a-z0-9一-鿿぀-ヿ가-힯-]+$/.test(f.slug))
    return "Slug 格式錯誤（只能用英數小寫、中文、連字號）";
  if (!f.content.replace(/<[^>]+>/g, "").trim()) return "內容為必填";
  if (!f.categoryId) return "請選擇分類";
  return null;
}

async function syncTags(postId: string, tagIds: string[]) {
  const supabase = getSupabaseAdmin();
  await supabase.from("post_tags").delete().eq("post_id", postId);
  if (tagIds.length === 0) return;
  const rows = tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId }));
  const { error } = await supabase.from("post_tags").insert(rows);
  if (error) throw error;
}

function revalidateAll(slug?: string) {
  revalidatePath("/", "layout"); // sidebar (recent / archive / categories / tags)
  revalidatePath("/admin/posts");
  revalidatePath("/admin");
  revalidatePath("/posts");
  if (slug) revalidatePath(`/posts/${slug}`);
}

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────
export async function createPostAction(formData: FormData) {
  await requireAuth();

  const fields = parseForm(formData);
  const error = validate(fields);
  if (error) {
    redirect(`/admin/posts/new?error=${encodeURIComponent(error)}`);
  }

  if (await isSlugTaken(fields.slug)) {
    redirect(
      `/admin/posts/new?error=${encodeURIComponent(`Slug "${fields.slug}" 已被使用`)}`,
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error: insertError } = await supabase
    .from("posts")
    .insert({
      title: fields.title,
      slug: fields.slug,
      excerpt: fields.excerpt,
      content: fields.content,
      cover_image: fields.coverImage,
      category_id: fields.categoryId,
      published: fields.published,
      published_at: fields.published ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (insertError || !data) {
    redirect(
      `/admin/posts/new?error=${encodeURIComponent(insertError?.message ?? "新增失敗")}`,
    );
  }

  await syncTags(data.id, fields.tagIds);
  revalidateAll(data.slug);
  redirect(`/admin/posts?notice=${encodeURIComponent("文章已新增")}`);
}

// ─────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────
export async function updatePostAction(id: string, formData: FormData) {
  await requireAuth();

  const fields = parseForm(formData);
  const error = validate(fields);
  if (error) {
    redirect(`/admin/posts/${id}/edit?error=${encodeURIComponent(error)}`);
  }

  if (await isSlugTaken(fields.slug, id)) {
    redirect(
      `/admin/posts/${id}/edit?error=${encodeURIComponent(`Slug "${fields.slug}" 已被其他文章使用`)}`,
    );
  }

  const supabase = getSupabaseAdmin();

  // 撈舊狀態判斷 published_at 要不要更新
  const { data: existing } = await supabase
    .from("posts")
    .select("published, published_at, slug")
    .eq("id", id)
    .single();

  const newlyPublished = fields.published && !existing?.published;
  const publishedAt = newlyPublished
    ? new Date().toISOString()
    : (existing?.published_at ?? null);

  const { error: updateError } = await supabase
    .from("posts")
    .update({
      title: fields.title,
      slug: fields.slug,
      excerpt: fields.excerpt,
      content: fields.content,
      cover_image: fields.coverImage,
      category_id: fields.categoryId,
      published: fields.published,
      published_at: fields.published ? publishedAt : null,
    })
    .eq("id", id);

  if (updateError) {
    redirect(
      `/admin/posts/${id}/edit?error=${encodeURIComponent(updateError.message)}`,
    );
  }

  await syncTags(id, fields.tagIds);
  if (existing?.slug && existing.slug !== fields.slug) {
    revalidatePath(`/posts/${existing.slug}`);
  }
  revalidateAll(fields.slug);
  redirect(`/admin/posts?notice=${encodeURIComponent("文章已更新")}`);
}

// ─────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────
export async function deletePostAction(id: string) {
  await requireAuth();
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    redirect(
      `/admin/posts?error=${encodeURIComponent(`刪除失敗：${error.message}`)}`,
    );
  }
  if (existing?.slug) revalidatePath(`/posts/${existing.slug}`);
  revalidateAll();
  redirect(`/admin/posts?notice=${encodeURIComponent("文章已刪除")}`);
}

// ─────────────────────────────────────────
// TOGGLE PUBLISH
// ─────────────────────────────────────────
export async function togglePublishAction(id: string) {
  await requireAuth();
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("posts")
    .select("published, published_at, slug")
    .eq("id", id)
    .single();

  if (!existing) {
    redirect(`/admin/posts?error=${encodeURIComponent("找不到文章")}`);
  }

  const nextPublished = !existing.published;
  const publishedAt = nextPublished
    ? (existing.published_at ?? new Date().toISOString())
    : existing.published_at;

  const { error } = await supabase
    .from("posts")
    .update({
      published: nextPublished,
      published_at: nextPublished ? publishedAt : null,
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/posts?error=${encodeURIComponent(error.message)}`);
  }
  if (existing.slug) revalidatePath(`/posts/${existing.slug}`);
  revalidateAll();
}

// ─────────────────────────────────────────
// CREATE TAG (供表單即時新增)
// ─────────────────────────────────────────
export async function createTagAction(name: string): Promise<Tag> {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("標籤名稱不可為空");
  const slug = slugify(trimmed);
  if (!slug) throw new Error("標籤名稱無法產生 slug");

  const supabase = getSupabaseAdmin();
  // 已存在就直接回傳
  const { data: existing } = await supabase
    .from("tags")
    .select("id, name, slug")
    .or(`slug.eq.${slug},name.eq.${trimmed}`)
    .limit(1)
    .maybeSingle();

  if (existing) return existing as Tag;

  const { data, error } = await supabase
    .from("tags")
    .insert({ name: trimmed, slug })
    .select("id, name, slug")
    .single();

  if (error || !data) throw new Error(error?.message ?? "新增標籤失敗");
  revalidatePath("/", "layout");
  return data as Tag;
}
