"use client";

import { useEffect, useState } from "react";
import type { Album } from "@/lib/types/album";
import { slugify } from "@/lib/utils/slugify";

type Props = {
  mode: "new" | "edit";
  initial?: Album;
  action: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
  noticeMessage?: string;
};

function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function AlbumForm({
  mode,
  initial,
  action,
  errorMessage,
  noticeMessage,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [publishedAtLocal, setPublishedAtLocal] = useState(() =>
    initial?.publishedAt && initial.published
      ? isoToLocalInput(initial.publishedAt)
      : "",
  );

  useEffect(() => {
    if (initial?.publishedAt && initial.published) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPublishedAtLocal(isoToLocalInput(initial.publishedAt));
    }
  }, [initial?.publishedAt, initial?.published]);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  const publishedAtIso = publishedAtLocal
    ? new Date(publishedAtLocal).toISOString()
    : "";

  return (
    <form action={action} className="space-y-6">
      {errorMessage ? (
        <p className="border border-red-500/40 bg-red-500/5 px-4 py-2 text-xs text-red-500">
          {errorMessage}
        </p>
      ) : null}
      {noticeMessage ? (
        <p className="border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 px-4 py-2 text-xs text-accent">
          {noticeMessage}
        </p>
      ) : null}

      <label className="block">
        <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
          標題
        </span>
        <input
          name="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
          maxLength={120}
          className="mt-2 w-full border border-[var(--color-border)] bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
          Slug（URL 路徑）
        </span>
        <input
          name="slug"
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          required
          maxLength={120}
          className="mt-2 w-full border border-[var(--color-border)] bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-foreground focus:outline-none"
        />
        <span className="mt-1 block text-[11px] text-muted">
          /albums/{slug || "your-slug"}
        </span>
      </label>

      <label className="block">
        <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
          說明（選填）
        </span>
        <textarea
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
          maxLength={500}
          className="mt-2 w-full border border-[var(--color-border)] bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
        />
      </label>

      <div className="space-y-3 border border-[var(--color-border)] p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="published"
            defaultChecked={initial?.published ?? false}
            className="h-4 w-4"
          />
          <span className="text-xs tracking-[0.2em] text-foreground uppercase">
            發布
          </span>
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
            發布時間（未填則用「現在」；可設未來時間排程）
          </span>
          <input
            type="datetime-local"
            value={publishedAtLocal}
            onChange={(e) => setPublishedAtLocal(e.target.value)}
            className="mt-2 w-full border border-[var(--color-border)] bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none sm:w-72"
          />
          <input type="hidden" name="publishedAtIso" value={publishedAtIso} />
        </label>
      </div>

      <button
        type="submit"
        className="cursor-pointer border border-foreground px-6 py-2 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background"
      >
        {mode === "new" ? "建立相簿" : "儲存變更"}
      </button>
    </form>
  );
}
