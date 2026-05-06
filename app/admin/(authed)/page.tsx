import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

async function getStats() {
  const supabase = getSupabaseAdmin();
  const [{ count: published }, { count: drafts }, { count: categories }, { count: tags }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("published", true),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("published", false),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("tags").select("*", { count: "exact", head: true }),
    ]);

  return {
    published: published ?? 0,
    drafts: drafts ?? 0,
    categories: categories ?? 0,
    tags: tags ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "已發布", value: stats.published, href: "/admin/posts?status=published" },
    { label: "草稿", value: stats.drafts, href: "/admin/posts?status=draft" },
    { label: "分類", value: stats.categories, href: "/admin/posts" },
    { label: "標籤", value: stats.tags, href: "/admin/posts" },
  ];

  return (
    <div>
      <header className="border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-muted">總覽部落格內容狀態。</p>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="block border border-[var(--color-border)] px-5 py-6 transition hover:border-[var(--color-accent)]"
          >
            <p className="text-[10px] tracking-[0.3em] text-muted uppercase">
              {card.label}
            </p>
            <p className="mt-3 font-serif text-3xl text-foreground">
              {card.value}
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl text-foreground">快速操作</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center border border-[var(--color-accent)] px-5 py-2.5 text-[11px] tracking-[0.3em] text-accent uppercase transition hover:bg-[var(--color-accent)] hover:text-background"
          >
            + 新增文章
          </Link>
          <Link
            href="/admin/posts"
            className="inline-flex items-center border border-[var(--color-border)] px-5 py-2.5 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:border-foreground"
          >
            管理文章
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">
          ※ 新增 / 編輯文章功能將於 Phase 2-B 實作。
        </p>
      </section>
    </div>
  );
}
