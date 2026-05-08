"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/lib/types/category";
import type { Tag } from "@/lib/types/tag";
import type { Post } from "@/lib/types/post";
import { TiptapEditor } from "@/components/admin/TiptapEditor";
import { TagsField } from "@/components/admin/TagsField";
import { CoverImageField } from "@/components/admin/CoverImageField";
import { slugify } from "@/lib/utils/slugify";

type Props = {
  mode: "new" | "edit";
  categories: Category[];
  allTags: Tag[];
  initial?: Post;
  action: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
};

function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isScheduledIso(iso: string): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}

export function PostForm({
  mode,
  categories,
  allTags,
  initial,
  action,
  errorMessage,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  // 初始只取 server / client 都一致的固定值（既有 ISO 或空字串）；
  // 「現在」交給 useEffect 在 client mount 後填，避免 server 用 UTC、client 用本地時區造成 hydration mismatch
  const [publishedAtLocal, setPublishedAtLocal] = useState(() =>
    initial?.publishedAt ? isoToLocalInput(initial.publishedAt) : "",
  );
  useEffect(() => {
    // mount 後用 client 本地時區重算
    // - edit：把既有 ISO 用本地時區轉成 datetime-local 字串（避免 server UTC 結果）
    // - new：填入「現在」（client 本地時區）
    if (initial?.publishedAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPublishedAtLocal(isoToLocalInput(initial.publishedAt));
    } else {
      setPublishedAtLocal((curr) =>
        curr ? curr : isoToLocalInput(new Date().toISOString()),
      );
    }
  }, [initial?.publishedAt]);
  const publishedAtIso = (() => {
    if (!publishedAtLocal) return "";
    const d = new Date(publishedAtLocal);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  })();
  const isScheduled = isScheduledIso(publishedAtIso);

  function onPreview(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const fd = new FormData(form);

    const tagIds = String(fd.get("tagIds") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const categoryId = String(fd.get("categoryId") ?? "");
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      alert("請先選擇分類再預覽");
      return;
    }

    const data = {
      title: String(fd.get("title") ?? "").trim(),
      content: String(fd.get("content") ?? ""),
      coverImage: String(fd.get("coverImage") ?? "").trim() || null,
      publishedAt: initial?.publishedAt ?? new Date().toISOString(),
      category: { name: category.name, slug: category.slug },
      tags: allTags
        .filter((t) => tagIds.includes(t.id))
        .map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
    };

    const key = crypto.randomUUID();
    try {
      localStorage.setItem(`post-preview-${key}`, JSON.stringify(data));
    } catch {
      alert("預覽資料寫入失敗（localStorage 滿了？）");
      return;
    }
    window.open(`/admin/preview?key=${key}`, "_blank", "noopener,noreferrer");
  }

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  return (
    <form action={action} className="space-y-8">
      {errorMessage ? (
        <div className="border border-red-500/50 bg-red-500/5 px-4 py-3 text-xs text-red-500">
          {errorMessage}
        </div>
      ) : null}

      {/* Title */}
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="text-[10px] tracking-[0.3em] text-muted uppercase"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="文章標題"
          className="h-12 w-full border-b border-[var(--color-border)] bg-transparent px-1 font-serif text-2xl text-foreground outline-none transition focus:border-[var(--color-accent)]"
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <label
          htmlFor="slug"
          className="text-[10px] tracking-[0.3em] text-muted uppercase"
        >
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          placeholder="my-post-slug"
          className="h-10 w-full border-b border-[var(--color-border)] bg-transparent px-1 font-mono text-sm text-foreground outline-none transition focus:border-[var(--color-accent)]"
        />
        <p className="text-[10px] text-subtle">
          URL 會是：<span className="font-mono">/posts/{slug || "..."}</span>
        </p>
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <label
          htmlFor="excerpt"
          className="text-[10px] tracking-[0.3em] text-muted uppercase"
        >
          Excerpt（摘要，可空）
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={initial?.excerpt ?? ""}
          placeholder="顯示在卡片與 OG meta 的短摘要"
          className="w-full resize-y border border-[var(--color-border)] bg-surface p-3 text-sm text-foreground outline-none transition focus:border-[var(--color-accent)]"
        />
      </div>

      {/* Cover Image */}
      <CoverImageField
        name="coverImage"
        defaultValue={initial?.coverImage ?? ""}
      />

      {/* Category + Published */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="categoryId"
            className="text-[10px] tracking-[0.3em] text-muted uppercase"
          >
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={initial?.category.id ?? ""}
            className="h-10 w-full cursor-pointer border-b border-[var(--color-border)] bg-transparent px-1 text-sm text-foreground outline-none transition focus:border-[var(--color-accent)]"
          >
            <option value="" disabled>
              選擇分類…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] tracking-[0.3em] text-muted uppercase">
            Status
          </label>
          <label className="flex h-10 cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="published"
              defaultChecked={initial?.published ?? false}
              className="h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
            />
            <span>發布</span>
            <span className="text-subtle">（未勾選為草稿）</span>
          </label>
        </div>
      </div>

      {/* 發布時間 / 排程 */}
      <div className="space-y-2">
        <label
          htmlFor="publishedAtLocal"
          className="text-[10px] tracking-[0.3em] text-muted uppercase"
        >
          Publish Date / Time
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="publishedAtLocal"
            type="datetime-local"
            value={publishedAtLocal}
            onChange={(e) => setPublishedAtLocal(e.target.value)}
            className="h-10 border border-[var(--color-border)] bg-surface px-3 font-mono text-sm text-foreground outline-none transition focus:border-[var(--color-accent)]"
          />
          <button
            type="button"
            onClick={() =>
              setPublishedAtLocal(isoToLocalInput(new Date().toISOString()))
            }
            className="cursor-pointer text-[10px] tracking-[0.3em] text-muted uppercase transition hover:text-foreground"
          >
            重設為現在
          </button>
          {isScheduled ? (
            <span className="border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 px-2 py-0.5 text-[10px] tracking-[0.2em] text-accent uppercase">
              Scheduled
            </span>
          ) : null}
        </div>
        <p className="text-[10px] text-subtle">
          ※ 未來時間 + 已勾選發布 = 排程到該時間才公開；過去時間 = 回填顯示日期。
        </p>
        <input type="hidden" name="publishedAtIso" value={publishedAtIso} />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-[10px] tracking-[0.3em] text-muted uppercase">
          Tags
        </label>
        <TagsField
          name="tagIds"
          allTags={allTags}
          defaultSelectedIds={initial?.tags.map((t) => t.id) ?? []}
        />
      </div>

      {/* Content */}
      <TiptapEditor name="content" defaultValue={initial?.content ?? ""} />

      {/* Submit */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-background px-4 py-4 sm:-mx-6 sm:px-6">
        <a
          href="/admin/posts"
          className="text-[11px] tracking-[0.3em] text-muted uppercase hover:text-foreground"
        >
          Cancel
        </a>
        <button
          type="button"
          onClick={onPreview}
          className="cursor-pointer border border-[var(--color-border)] px-5 py-2.5 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:border-foreground"
        >
          Preview
        </button>
        <button
          type="submit"
          className="cursor-pointer border border-[var(--color-accent)] px-6 py-2.5 text-[11px] tracking-[0.3em] text-accent uppercase transition hover:bg-[var(--color-accent)] hover:text-background"
        >
          {mode === "new" ? "Create Post" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
