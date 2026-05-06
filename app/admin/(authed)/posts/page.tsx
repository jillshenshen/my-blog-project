import type { Metadata } from "next";
import Link from "next/link";
import {
  type AdminPostFilter,
  getAllPostsForAdmin,
} from "@/lib/supabase/queries/admin-posts";
import { formatDate } from "@/lib/utils/format";
import { DeletePostButton } from "@/components/admin/DeletePostButton";
import {
  deletePostAction,
  togglePublishAction,
} from "@/app/admin/(authed)/posts/actions";

export const metadata: Metadata = {
  title: "Posts",
  robots: { index: false, follow: false },
};

const FILTER_TABS: { label: string; value: AdminPostFilter }[] = [
  { label: "全部", value: "all" },
  { label: "已發布", value: "published" },
  { label: "草稿", value: "draft" },
];

type SearchParams = {
  status?: AdminPostFilter;
  notice?: string;
  error?: string;
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status, notice, error } = await searchParams;
  const filter: AdminPostFilter =
    status === "published" || status === "draft" ? status : "all";

  const posts = await getAllPostsForAdmin(filter);

  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
            Posts
          </h1>
          <p className="mt-2 text-sm text-muted">管理所有文章（含草稿）。</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center self-start border border-[var(--color-accent)] px-5 py-2.5 text-[11px] tracking-[0.3em] text-accent uppercase transition hover:bg-[var(--color-accent)] hover:text-background sm:self-auto"
        >
          + 新增文章
        </Link>
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

      <nav className="mt-6 flex gap-1 border-b border-[var(--color-border)]">
        {FILTER_TABS.map((t) => {
          const active = filter === t.value;
          return (
            <Link
              key={t.value}
              href={`/admin/posts${t.value === "all" ? "" : `?status=${t.value}`}`}
              className={`-mb-px border-b-2 px-4 py-2 text-[11px] tracking-[0.25em] uppercase transition ${
                active
                  ? "border-[var(--color-accent)] text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {posts.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">
          目前沒有文章。
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[9px] tracking-[0.2em] uppercase ${
                      post.published
                        ? "bg-[var(--color-accent)]/10 text-accent"
                        : "bg-[var(--color-border)] text-muted"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="truncate font-serif text-lg text-foreground hover:text-muted"
                  >
                    {post.title}
                  </Link>
                </div>
                <p className="mt-1 truncate text-xs text-muted">
                  {post.category.name}
                  <span className="mx-2 text-subtle">·</span>
                  <span className="font-mono">{post.slug}</span>
                  <span className="mx-2 text-subtle">·</span>
                  {formatDate(post.updatedAt)}
                </p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-4">
                {post.published ? (
                  <Link
                    href={`/posts/${post.slug}`}
                    target="_blank"
                    className="text-[11px] tracking-[0.2em] text-muted uppercase hover:text-foreground"
                  >
                    View ↗
                  </Link>
                ) : null}
                <form action={togglePublishAction.bind(null, post.id)}>
                  <button
                    type="submit"
                    className="cursor-pointer text-[11px] tracking-[0.2em] text-foreground uppercase transition hover:text-accent"
                  >
                    {post.published ? "Unpublish" : "Publish"}
                  </button>
                </form>
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="text-[11px] tracking-[0.2em] text-foreground uppercase hover:text-accent"
                >
                  Edit
                </Link>
                <DeletePostButton
                  title={post.title}
                  action={deletePostAction.bind(null, post.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
