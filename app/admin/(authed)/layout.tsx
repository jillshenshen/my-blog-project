import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";
import { logoutAction } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)] bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-script text-2xl text-foreground"
            >
              Jill&apos;s blog
            </Link>
            <span className="hidden text-[10px] tracking-[0.3em] text-accent uppercase sm:inline">
              Admin
            </span>
            <nav className="hidden items-center gap-5 sm:flex">
              <Link
                href="/admin"
                className="text-xs tracking-[0.2em] text-foreground transition hover:text-muted"
              >
                DASHBOARD
              </Link>
              <Link
                href="/admin/posts"
                className="text-xs tracking-[0.2em] text-foreground transition hover:text-muted"
              >
                POSTS
              </Link>
              <Link
                href="/admin/categories"
                className="text-xs tracking-[0.2em] text-foreground transition hover:text-muted"
              >
                CATEGORIES
              </Link>
              <Link
                href="/admin/tags"
                className="text-xs tracking-[0.2em] text-foreground transition hover:text-muted"
              >
                TAGS
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden text-[11px] tracking-[0.2em] text-muted uppercase transition hover:text-foreground sm:inline"
            >
              View Site ↗
            </Link>
            <span className="hidden text-xs text-muted sm:inline">
              {user.email}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="cursor-pointer text-[11px] tracking-[0.2em] text-foreground uppercase transition hover:text-accent"
              >
                Logout
              </button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
