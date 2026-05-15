import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types/post";
import { stripHtmlToText } from "@/lib/utils/format";

type Props = {
  post: Post;
};

function formatYmd(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function PostGridCard({ post }: Props) {
  const preview = stripHtmlToText(post.content, 200);
  return (
    // group + relative：搭配下方標題 Link 的 after 偽元素覆蓋整張卡片，讓任何位置點擊都進文章
    <article className="group relative flex h-[360px] w-[250px] cursor-pointer flex-col border border-[var(--color-border)] bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.05)] [[data-theme=dark]_&]:bg-[#1d1d20]">
      <div className="relative block aspect-[3/2] w-full overflow-hidden bg-[var(--color-border)]">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] tracking-[0.3em] text-muted uppercase">
            No Cover
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 pt-5 pb-20">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap gap-3 text-accent">
            {/* z-10 讓分類 / 標籤連結浮在 stretched link 之上、仍可獨立點擊 */}
            <Link
              href={`/categories/${post.category.slug}`}
              className="relative z-10 transition hover:opacity-70"
            >
              {post.category.name}
            </Link>
            {post.tags.slice(0, 1).map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="relative z-10 transition hover:opacity-70"
              >
                {tag.name}
              </Link>
            ))}
          </div>
          <span className="flex-shrink-0 text-muted">
            {formatYmd(post.publishedAt)}
          </span>
        </div>

        <h2 className="mt-2 font-serif text-sm font-bold leading-snug text-foreground sm:text-base">
          {/* stretched link：after 偽元素覆蓋整張 article，整卡可點 */}
          <Link
            href={`/posts/${post.slug}`}
            className="transition after:absolute after:inset-0 after:content-[''] group-hover:text-muted"
          >
            {post.title}
          </Link>
        </h2>

        {preview ? (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">
            {preview}
          </p>
        ) : null}
      </div>
    </article>
  );
}
