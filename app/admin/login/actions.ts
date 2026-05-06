"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin");

  if (!email || !password) {
    redirect(`/admin/login?error=${encodeURIComponent("請輸入 Email 與密碼")}`);
  }

  const supabase = await getSupabaseServerWithAuth();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(redirectTo.startsWith("/admin") ? redirectTo : "/admin");
}
