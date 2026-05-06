"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";

export async function logoutAction() {
  const supabase = await getSupabaseServerWithAuth();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
