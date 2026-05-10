"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";

async function requireAuth() {
  const supabase = await getSupabaseServerWithAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return user;
}

export async function updateSiteSettingsAction(formData: FormData) {
  await requireAuth();

  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();

  if (!title) {
    redirect(`/admin/settings?error=${encodeURIComponent("主標題不可為空")}`);
  }
  if (!subtitle) {
    redirect(`/admin/settings?error=${encodeURIComponent("副標題不可為空")}`);
  }

  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("site_settings").upsert(
    [
      { key: "site_title", value: title, updated_at: now },
      { key: "site_subtitle", value: subtitle, updated_at: now },
    ],
    { onConflict: "key" },
  );

  if (error) {
    redirect(`/admin/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  redirect(`/admin/settings?notice=${encodeURIComponent("已更新")}`);
}
