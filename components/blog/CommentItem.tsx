"use client";

import { useState } from "react";
import type { Comment, CommentThread } from "@/lib/types/comment";
import { CommentForm } from "@/components/blog/CommentForm";
import { formatDate } from "@/lib/utils/format";

type Props = {
  thread: CommentThread;
  postSlug: string;
};

function Avatar({ src, alt, size = 28 }: { src: string | null; alt: string; size?: number }) {
  if (!src) {
    return (
      <span
        aria-hidden
        className="inline-block rounded-full bg-[var(--color-border)]"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full object-cover"
      referrerPolicy="no-referrer"
      style={{ width: size, height: size }}
    />
  );
}

function VerifiedBadge() {
  return (
    <span
      title="已驗證身份"
      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] text-background"
    >
      ✓
    </span>
  );
}

function ReplyBlock({ reply }: { reply: Comment }) {
  return (
    <li className="border-l border-[var(--color-border)] pl-4">
      <div className="flex items-center gap-3">
        <Avatar src={reply.authorAvatar} alt={reply.authorName} size={22} />
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-sm text-foreground">
            {reply.authorName}
          </span>
          {reply.verified ? <VerifiedBadge /> : null}
          <span className="text-[10px] tracking-[0.2em] text-subtle uppercase">
            {formatDate(reply.createdAt)}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
        {reply.content}
      </p>
    </li>
  );
}

export function CommentItem({ thread, postSlug }: Props) {
  const [showReply, setShowReply] = useState(false);

  return (
    <li className="border-b border-[var(--color-border)] py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={thread.authorAvatar} alt={thread.authorName} size={32} />
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-base text-foreground">
              {thread.authorName}
            </span>
            {thread.verified ? <VerifiedBadge /> : null}
            <span className="text-[10px] tracking-[0.2em] text-subtle uppercase">
              {formatDate(thread.createdAt)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowReply((v) => !v)}
          className="cursor-pointer text-[10px] tracking-[0.2em] text-muted uppercase transition hover:text-foreground"
        >
          {showReply ? "Cancel" : "Reply"}
        </button>
      </div>

      <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
        {thread.content}
      </p>

      {showReply ? (
        <div className="mt-4">
          <CommentForm
            postSlug={postSlug}
            parentId={thread.id}
            onSuccess={() => setShowReply(false)}
            autoFocus
            compact
          />
        </div>
      ) : null}

      {thread.replies.length > 0 ? (
        <ul className="mt-5 space-y-4">
          {thread.replies.map((r) => (
            <ReplyBlock key={r.id} reply={r} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
