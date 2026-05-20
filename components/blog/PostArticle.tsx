import Image from "next/image";
import Link from "next/link";
import { HtmlContent } from "@/components/blog/HtmlContent";
import { formatDate } from "@/lib/utils/format";
import {
  calculateReadingTime,
  formatReadingTime,
} from "@/lib/utils/reading-time";

export type PostArticleData = {
  title: string;
  content: string;
  coverImage: string | null;
  publishedAt: string;
  category: { name: string; slug: string };
  tags: { id: string; name: string; slug: string }[];
};

type Props = {
  post: PostArticleData;
  /** preview 模式：分類/標籤連結為 # (避免新分頁誤跳轉) */
  isPreview?: boolean;
};

export function PostArticle({ post, isPreview = false }: Props) {
  const readingTime = calculateReadingTime(post.content);
  const categoryHref = isPreview
    ? "#"
    : `/categories/${post.category.slug}`;
  const tagHref = (slug: string) => (isPreview ? "#" : `/tags/${slug}`);

  return (
    <article className="px-2 py-6 sm:px-6 sm:py-10">
      <header className="text-center">
        <Link
          href={categoryHref}
          className="text-[10px] tracking-[0.3em] text-accent uppercase"
        >
          {post.category.name}
        </Link>
        <h1 className="mt-3 font-title font-normal text-3xl text-foreground sm:text-4xl">
          {post.title || "（未填標題）"}
        </h1>
        <p className="mt-3 text-[10px] tracking-[0.3em] text-muted uppercase">
          {formatDate(post.publishedAt)}
          <span className="mx-2 text-subtle">·</span>
          {formatReadingTime(readingTime)}
        </p>
      </header>

      {post.coverImage ? (
        <div className="mt-8 overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={1200}
            height={800}
            sizes="(max-width: 1024px) 100vw, 720px"
            className="h-auto w-full object-cover"
            priority
            unoptimized={isPreview}
          />
        </div>
      ) : null}

      <div className="mt-10">
        <HtmlContent html={post.content} />
      </div>

      {post.tags.length > 0 ? (
        <footer className="mt-12 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
            Tags
          </span>
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              href={tagHref(tag.slug)}
              className="inline-block border border-[var(--color-accent)] px-3 py-1.5 text-[10px] tracking-[0.25em] text-accent lowercase transition hover:bg-[var(--color-accent)] hover:text-background"
            >
              #{tag.name}
            </Link>
          ))}
        </footer>
      ) : null}
    </article>
  );
}
