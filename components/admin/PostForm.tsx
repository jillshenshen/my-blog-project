"use client";

import { useState } from "react";
import type { Category } from "@/lib/types/category";
import type { Tag } from "@/lib/types/tag";
import type { Post } from "@/lib/types/post";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { TagsField } from "@/components/admin/TagsField";
import { slugify } from "@/lib/utils/slugify";

type Props = {
  mode: "new" | "edit";
  categories: Category[];
  allTags: Tag[];
  initial?: Post;
  action: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
};

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
      <div className="space-y-2">
        <label
          htmlFor="coverImage"
          className="text-[10px] tracking-[0.3em] text-muted uppercase"
        >
          Cover Image URL（可空，Phase 2-C 將支援上傳）
        </label>
        <input
          id="coverImage"
          name="coverImage"
          type="url"
          defaultValue={initial?.coverImage ?? ""}
          placeholder="https://..."
          className="h-10 w-full border-b border-[var(--color-border)] bg-transparent px-1 font-mono text-sm text-foreground outline-none transition focus:border-[var(--color-accent)]"
        />
      </div>

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
            <span>立即發布</span>
            <span className="text-subtle">（未勾選為草稿）</span>
          </label>
        </div>
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
      <MarkdownEditor name="content" defaultValue={initial?.content ?? ""} />

      {/* Submit */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-background px-4 py-4 sm:-mx-6 sm:px-6">
        <a
          href="/admin/posts"
          className="text-[11px] tracking-[0.3em] text-muted uppercase hover:text-foreground"
        >
          Cancel
        </a>
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
