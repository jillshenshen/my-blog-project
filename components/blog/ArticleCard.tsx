import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types/post";
import { formatDate } from "@/lib/utils/format";
import {
  calculateReadingTime,
  formatReadingTime,
} from "@/lib/utils/reading-time";

type Props = {
  post: Post;
};

export function ArticleCard({ post }: Props) {
  const readingTime = calculateReadingTime(post.content);

  return (
    <article className="border-b border-[var(--color-border)] px-6 py-10 sm:px-12 sm:py-14">
      <header className="text-center">
        <Link
          href={`/categories/${post.category.slug}`}
          className="text-[10px] tracking-[0.3em] text-accent uppercase"
        >
          {post.category.name}
        </Link>

        <h2 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
          <Link href={`/posts/${post.slug}`} className="hover:text-muted">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 text-[10px] tracking-[0.3em] text-muted uppercase">
          {formatDate(post.publishedAt)}
          <span className="mx-2 text-subtle">·</span>
          {formatReadingTime(readingTime)}
        </p>
      </header>

      <div className="mt-8 overflow-hidden">
        <Link href={`/posts/${post.slug}`} className="block">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={1200}
            height={800}
            className="h-auto w-full object-cover"
          />
        </Link>
      </div>

      <p className="mt-8 text-center text-sm leading-loose text-muted sm:text-base">
        {post.excerpt}
      </p>

      <div className="mt-8 flex justify-center">
        <Link
          href={`/posts/${post.slug}`}
          className="border-b border-foreground pb-1 text-[11px] tracking-[0.3em] text-foreground uppercase hover:text-muted"
        >
          Continue Reading
        </Link>
      </div>

      {post.tags.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="text-[10px] tracking-[0.2em] text-accent lowercase transition hover:opacity-70"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}
