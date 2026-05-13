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

export async function deleteCommentAction(id: string) {
  await requireAuth();
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("comments")
    .select("post:posts(slug)")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) {
    redirect(
      `/admin/comments?error=${encodeURIComponent(`刪除失敗：${error.message}`)}`,
    );
  }

  const slug = (existing as unknown as { post: { slug: string } } | null)?.post
    ?.slug;
  if (slug) revalidatePath(`/posts/${slug}`);
  revalidatePath("/admin/comments");

  redirect(`/admin/comments?notice=${encodeURIComponent("留言已刪除")}`);
}
