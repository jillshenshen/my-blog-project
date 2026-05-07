"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";
import { slugify } from "@/lib/utils/slugify";

async function requireAuth() {
  const supabase = await getSupabaseServerWithAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return user;
}

function revalidateAll() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/posts");
}

export async function createCategoryAction(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(
      `/admin/categories?error=${encodeURIComponent("分類名稱不可為空")}`,
    );
  }
  const slug = slugify(name);
  if (!slug) {
    redirect(
      `/admin/categories?error=${encodeURIComponent("名稱無法產生 slug")}`,
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .or(`slug.eq.${slug},name.eq.${name}`)
    .limit(1)
    .maybeSingle();
  if (existing) {
    redirect(
      `/admin/categories?error=${encodeURIComponent("已存在同名或同 slug 的分類")}`,
    );
  }

  const { error } = await supabase
    .from("categories")
    .insert({ name, slug });
  if (error) {
    redirect(`/admin/categories?error=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  redirect(`/admin/categories?notice=${encodeURIComponent("已新增分類")}`);
}

export async function renameCategoryAction(id: string, formData: FormData) {
  await requireAuth();
  const newName = String(formData.get("name") ?? "").trim();
  if (!newName) {
    redirect(`/admin/categories?error=${encodeURIComponent("名稱不可為空")}`);
  }
  const newSlug = slugify(newName);
  if (!newSlug) {
    redirect(
      `/admin/categories?error=${encodeURIComponent("無法從名稱產生 slug")}`,
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .or(`slug.eq.${newSlug},name.eq.${newName}`)
    .neq("id", id)
    .limit(1)
    .maybeSingle();
  if (existing) {
    redirect(
      `/admin/categories?error=${encodeURIComponent("已存在同名或同 slug 的分類")}`,
    );
  }

  const { error } = await supabase
    .from("categories")
    .update({ name: newName, slug: newSlug })
    .eq("id", id);
  if (error) {
    redirect(`/admin/categories?error=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  redirect(`/admin/categories?notice=${encodeURIComponent("已更新")}`);
}

export async function deleteCategoryAction(id: string) {
  await requireAuth();
  const supabase = getSupabaseAdmin();

  // posts.category_id 是 ON DELETE RESTRICT，先檢查有沒有文章引用
  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(`此分類仍有 ${count} 篇文章，請先把文章改到其他分類再刪除`)}`,
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(`刪除失敗：${error.message}`)}`,
    );
  }
  revalidateAll();
  redirect(`/admin/categories?notice=${encodeURIComponent("已刪除")}`);
}
