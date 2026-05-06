"use client";

import { useState, useTransition } from "react";
import type { Tag } from "@/lib/types/tag";
import { createTagAction } from "@/app/admin/(authed)/posts/actions";

type Props = {
  name: string;
  allTags: Tag[];
  defaultSelectedIds?: string[];
};

export function TagsField({ name, allTags, defaultSelectedIds = [] }: Props) {
  const [available, setAvailable] = useState<Tag[]>(allTags);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaultSelectedIds),
  );
  const [newTag, setNewTag] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const name = newTag.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      try {
        const tag = await createTagAction(name);
        if (!available.some((t) => t.id === tag.id)) {
          setAvailable([...available, tag]);
        }
        setSelected(new Set([...selected, tag.id]));
        setNewTag("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "新增失敗");
      }
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={Array.from(selected).join(",")} />

      <div className="flex flex-wrap gap-2">
        {available.map((tag) => {
          const active = selected.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              className={`cursor-pointer border px-3 py-1.5 text-[10px] tracking-[0.25em] lowercase transition ${
                active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-background"
                  : "border-[var(--color-border)] text-muted hover:border-foreground hover:text-foreground"
              }`}
            >
              #{tag.name}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCreate(e);
            }
          }}
          placeholder="新標籤名稱..."
          className="h-8 w-48 border-b border-[var(--color-border)] bg-transparent px-1 text-sm text-foreground outline-none transition focus:border-[var(--color-accent)]"
        />
        <button
          type="button"
          onClick={onCreate}
          disabled={pending || !newTag.trim()}
          className="cursor-pointer text-[10px] tracking-[0.3em] text-accent uppercase transition hover:opacity-70 disabled:opacity-30"
        >
          {pending ? "..." : "+ 新增"}
        </button>
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
