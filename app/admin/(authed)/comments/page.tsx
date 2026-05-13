import type { Metadata } from "next";
import Link from "next/link";
import { getAllCommentsForAdmin } from "@/lib/supabase/queries/admin-comments";
import { formatDate } from "@/lib/utils/format";
import { DeleteCommentButton } from "@/components/admin/DeleteCommentButton";
import { deleteCommentAction } from "@/app/admin/(authed)/comments/actions";

export const metadata: Metadata = {
  title: "Comments",
  robots: { index: false, follow: false },
};

type SearchParams = { notice?: string; error?: string };

function previewContent(content: string, max = 30) {
  const t = content.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { notice, error } = await searchParams;
  const comments = await getAllCommentsForAdmin();

  return (
    <div>
      <header className="border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          Comments
        </h1>
        <p className="mt-2 text-sm text-muted">
          所有留言（含回覆），按時間新到舊排列。
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

      {comments.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">目前沒有留言。</p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-border)]">
          {comments.map((c) => {
            const isReply = c.parentId !== null;
            return (
              <li key={c.id} className="py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {isReply ? (
                        <span className="inline-block rounded-full bg-[var(--color-border)] px-2 py-0.5 text-[9px] tracking-[0.2em] text-muted uppercase">
                          Reply
                        </span>
                      ) : null}
                      {c.verified ? (
                        <span className="inline-block rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-[9px] tracking-[0.2em] text-accent uppercase">
                          ✓ Verified
                        </span>
                      ) : null}
                      <span className="font-serif text-base text-foreground">
                        {c.authorName}
                      </span>
                      <span className="text-xs text-muted">
                        {c.authorEmail}
                      </span>
                      <span className="text-[10px] tracking-[0.2em] text-subtle uppercase">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {c.content}
                    </p>
                    <p className="mt-2 text-[11px] text-muted">
                      文章：
                      <Link
                        href={`/posts/${c.postSlug}`}
                        target="_blank"
                        className="ml-1 underline hover:text-foreground"
                      >
                        {c.postTitle} ↗
                      </Link>
                    </p>
                  </div>
                  <DeleteCommentButton
                    preview={previewContent(c.content)}
                    action={deleteCommentAction.bind(null, c.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
