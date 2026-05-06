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
  revalidatePath("/admin/tags");
}

export async function renameTagAction(id: string, formData: FormData) {
  await requireAuth();
  const newName = String(formData.get("name") ?? "").trim();
  if (!newName) {
    redirect(`/admin/tags?error=${encodeURIComponent("名稱不可為空")}`);
  }
  const newSlug = slugify(newName);
  if (!newSlug) {
    redirect(`/admin/tags?error=${encodeURIComponent("無法從名稱產生 slug")}`);
  }

  const supabase = getSupabaseAdmin();

  // 檢查 slug 衝突
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .or(`slug.eq.${newSlug},name.eq.${newName}`)
    .neq("id", id)
    .limit(1)
    .maybeSingle();
  if (existing) {
    redirect(
      `/admin/tags?error=${encodeURIComponent(`已存在同名或同 slug 的標籤`)}`,
    );
  }

  const { error } = await supabase
    .from("tags")
    .update({ name: newName, slug: newSlug })
    .eq("id", id);
  if (error) {
    redirect(`/admin/tags?error=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  redirect(`/admin/tags?notice=${encodeURIComponent("已更新")}`);
}

export async function deleteTagAction(id: string) {
  await requireAuth();
  const supabase = getSupabaseAdmin();

  // 連動的 post_tags 會 cascade 刪除（schema 已設定 on delete cascade）
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) {
    redirect(
      `/admin/tags?error=${encodeURIComponent(`刪除失敗：${error.message}`)}`,
    );
  }
  revalidateAll();
  redirect(`/admin/tags?notice=${encodeURIComponent("已刪除")}`);
}
