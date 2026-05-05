import "server-only";
import type { Category } from "@/lib/types/category";
import type { Tag } from "@/lib/types/tag";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function getAllCategories(): Promise<Category[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return (data as Category | null) ?? null;
}

export async function getAllTags(): Promise<Tag[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Tag[];
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return (data as Tag | null) ?? null;
}
