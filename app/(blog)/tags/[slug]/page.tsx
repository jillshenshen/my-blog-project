import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  getAllTags,
  getPostsByTag,
} from "@/lib/data/mock-posts";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllTags().map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = getAllTags().find((t) => t.slug === slug);
  if (!tag) return { title: "Not Found" };
  return {
    title: `#${tag.name}`,
    description: `所有標籤為 ${tag.name} 的文章。`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const tag = getAllTags().find((t) => t.slug === slug);
  if (!tag) notFound();

  const posts = getPostsByTag(slug);

  return (
    <>
      <SectionHeading className="pt-4">#{tag.name}</SectionHeading>
      {posts.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">
          此分類目前沒有文章。
        </p>
      ) : (
        <div>
          {posts.map((post) => (
            <ArticleCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </>
  );
}
