import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { getAllPosts, getPostBySlug } from "@/lib/supabase/queries/posts";
import { formatDate } from "@/lib/utils/format";
import {
  calculateReadingTime,
  formatReadingTime,
} from "@/lib/utils/reading-time";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: post.coverImage }],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const readingTime = calculateReadingTime(post.content);

  return (
    <article className="border border-[var(--color-border)] bg-surface px-6 py-10 sm:px-12 sm:py-14">
      <header className="text-center">
        <Link
          href={`/categories/${post.category.slug}`}
          className="text-[10px] tracking-[0.3em] text-accent uppercase"
        >
          {post.category.name}
        </Link>
        <h1 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-3 text-[10px] tracking-[0.3em] text-muted uppercase">
          {formatDate(post.publishedAt)}
          <span className="mx-2 text-subtle">·</span>
          {formatReadingTime(readingTime)}
        </p>
      </header>

      <div className="mt-8 overflow-hidden">
        <Image
          src={post.coverImage}
          alt={post.title}
          width={1200}
          height={800}
          className="h-auto w-full object-cover"
          priority
        />
      </div>

      <div className="mt-10">
        <MarkdownRenderer content={post.content} />
      </div>

      {post.tags.length > 0 ? (
        <footer className="mt-12 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
            Tags
          </span>
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
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
