import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CategoryAdminRow } from "@/components/admin/CategoryAdminRow";
import {
  createCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
} from "@/app/admin/(authed)/categories/actions";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};

type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

async function getCategoriesWithCount(): Promise<CategoryWithCount[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, posts(count)")
    .order("name", { ascending: true });
  if (error) throw error;
  type Row = {
    id: string;
    name: string;
    slug: string;
    posts: { count: number }[];
  };
  return (data as Row[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    postCount: row.posts?.[0]?.count ?? 0,
  }));
}

type SearchParams = { notice?: string; error?: string };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { notice, error } = await searchParams;
  const categories = await getCategoriesWithCount();

  return (
    <div>
      <header className="border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          Categories
        </h1>
        <p className="mt-2 text-sm text-muted">
          管理所有文章分類。每篇文章只屬於一個分類。
        </p>
      </header>

      {notice ? (
        <p className="mt-4 border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 px-4 py-2 text-xs text-accent">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 border border-red-500/40 bg-red-500/5 px-4 py-2 text-xs text-red-500">
          {error}
        </p>
      ) : null}

      {/* 新增分類 */}
      <section className="mt-6 border border-[var(--color-border)] p-4">
        <p className="mb-3 text-[10px] tracking-[0.3em] text-muted uppercase">
          新增分類
        </p>
        <form
          action={createCategoryAction}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input
            type="text"
            name="name"
            required
            placeholder="分類名稱"
            className="h-10 flex-1 border-b border-[var(--color-border)] bg-transparent px-1 text-sm text-foreground outline-none focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            className="cursor-pointer border border-[var(--color-accent)] px-5 py-2 text-[11px] tracking-[0.3em] text-accent uppercase transition hover:bg-[var(--color-accent)] hover:text-background"
          >
            + 新增
          </button>
        </form>
      </section>

      {/* 分類列表 */}
      {categories.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">
          目前沒有分類。
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-border)]">
          {categories.map((cat) => (
            <CategoryAdminRow
              key={cat.id}
              id={cat.id}
              name={cat.name}
              slug={cat.slug}
              postCount={cat.postCount}
              renameAction={renameCategoryAction.bind(null, cat.id)}
              deleteAction={deleteCategoryAction.bind(null, cat.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
