"use client";

import { useState } from "react";
import { CommentForm } from "@/components/blog/CommentForm";

type Props = {
  postSlug: string;
};

export function CommentComposer({ postSlug }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer border border-foreground px-5 py-2 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background"
        >
          Write a comment
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <CommentForm
        postSlug={postSlug}
        autoFocus
        onSuccess={() => setOpen(false)}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer text-[10px] tracking-[0.2em] text-muted uppercase transition hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
