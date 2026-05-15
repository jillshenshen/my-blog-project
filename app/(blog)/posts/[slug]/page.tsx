import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/blog/PostArticle";
import { ShareInline } from "@/components/blog/ShareInline";
import { Comments } from "@/components/blog/Comments";
import {
  getAdjacentPosts,
  getAllPosts,
  getPostBySlug,
} from "@/lib/supabase/queries/posts";
import { getCommentsForPost } from "@/lib/supabase/queries/comments";
import { decodeParam } from "@/lib/utils/decode-param";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

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
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
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
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [threads, adjacent] = await Promise.all([
    getCommentsForPost(post.id),
    getAdjacentPosts(post.id, post.publishedAt),
  ]);
  const url = `${SITE_URL}/posts/${post.slug}`;

  const commentTotal = threads.reduce(
    (sum, t) => sum + 1 + t.replies.length,
    0,
  );

  return (
    <div>
      <PostArticle post={post} />

      <footer className="mt-10 flex items-center justify-between sm:px-6">
        <Link
          href="#comments"
          className="text-[10px] tracking-[0.3em] text-muted uppercase transition hover:text-foreground"
        >
          {commentTotal} Comments
        </Link>
        <ShareInline url={url} title={post.title} />
      </footer>

      <nav className="mt-6 flex items-center justify-between gap-4 bg-[var(--color-border)] px-3 py-4 sm:px-4">
        {adjacent.previous ? (
          <Link
            href={`/posts/${adjacent.previous.slug}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted transition hover:text-foreground"
          >
            <span aria-hidden>←</span>
            <span>Previous Story</span>
          </Link>
        ) : (
          <span />
        )}
        {adjacent.next ? (
          <Link
            href={`/posts/${adjacent.next.slug}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted transition hover:text-foreground"
          >
            <span>Next Story</span>
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <Comments postSlug={post.slug} threads={threads} />
    </div>
  );
}
