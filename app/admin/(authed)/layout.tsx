import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";
import { getSiteSettings } from "@/lib/supabase/queries/site-settings";

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerWithAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 雙保險：middleware 已擋過，這裡若還是無 user 就 redirect（防 race）
  if (!user) redirect("/admin/login");

  const { title } = await getSiteSettings();

  return (
    <AdminShell siteTitle={title} userEmail={user.email ?? ""}>
      {children}
    </AdminShell>
  );
}
