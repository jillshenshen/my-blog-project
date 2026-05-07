"use client";

import { useState } from "react";

type Props = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
  renameAction: (formData: FormData) => void | Promise<void>;
  deleteAction: () => void | Promise<void>;
};

export function CategoryAdminRow({
  id,
  name,
  slug,
  postCount,
  renameAction,
  deleteAction,
}: Props) {
  const [editing, setEditing] = useState(false);

  function onDelete(e: React.FormEvent<HTMLFormElement>) {
    if (postCount > 0) {
      // 後端會擋下，前端先給友善提示
      alert(
        `「${name}」目前被 ${postCount} 篇文章使用，請先把文章改到其他分類再刪除。`,
      );
      e.preventDefault();
      return;
    }
    if (!confirm(`確定要刪除分類「${name}」？`)) e.preventDefault();
  }

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      {editing ? (
        <form
          action={renameAction}
          onSubmit={() => setEditing(false)}
          className="flex flex-1 items-center gap-3"
        >
          <input
            type="text"
            name="name"
            defaultValue={name}
            autoFocus
            required
            className="h-9 flex-1 border-b border-[var(--color-accent)] bg-transparent px-1 text-sm text-foreground outline-none"
          />
          <button
            type="submit"
            className="cursor-pointer text-[10px] tracking-[0.3em] text-accent uppercase transition hover:opacity-70"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="cursor-pointer text-[10px] tracking-[0.3em] text-muted uppercase transition hover:text-foreground"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">
            {name}
            <span className="ml-3 font-mono text-xs text-subtle">{slug}</span>
          </p>
          <p className="mt-1 text-[10px] tracking-[0.25em] text-muted uppercase">
            被 {postCount} 篇文章使用
          </p>
        </div>
      )}

      {!editing ? (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="cursor-pointer text-[11px] tracking-[0.2em] text-foreground uppercase transition hover:text-accent"
          >
            Rename
          </button>
          <form action={deleteAction} onSubmit={onDelete} className="inline">
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="cursor-pointer text-[11px] tracking-[0.2em] text-red-500 uppercase transition hover:opacity-70"
            >
              Delete
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
