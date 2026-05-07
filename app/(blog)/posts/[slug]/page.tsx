import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/blog/PostArticle";
import { getAllPosts, getPostBySlug } from "@/lib/supabase/queries/posts";
import { decodeParam } from "@/lib/utils/decode-param";

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

  return <PostArticle post={post} />;
}
