import type { CommentThread } from "@/lib/types/comment";
import { CommentComposer } from "@/components/blog/CommentComposer";
import { CommentItem } from "@/components/blog/CommentItem";

type Props = {
  postSlug: string;
  threads: CommentThread[];
};

export function Comments({ postSlug, threads }: Props) {
  const total = threads.reduce(
    (sum, t) => sum + 1 + t.replies.length,
    0,
  );

  return (
    <section id="comments" className="mt-10 scroll-mt-24">
      <div className="flex justify-center">
        <span className="border-b border-[var(--color-border)] pb-3 text-[11px] tracking-[0.3em] text-muted uppercase">
          {total} Comments
        </span>
      </div>

      {threads.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          目前還沒有留言，搶個沙發吧。
        </p>
      ) : (
        <ul>
          {threads.map((thread) => (
            <CommentItem
              key={thread.id}
              thread={thread}
              postSlug={postSlug}
            />
          ))}
        </ul>
      )}

      <div className="mt-10">
        <CommentComposer postSlug={postSlug} />
      </div>
    </section>
  );
}
