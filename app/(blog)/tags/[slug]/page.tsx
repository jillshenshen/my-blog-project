import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPostsByTag } from "@/lib/supabase/queries/posts";
import { getAllTags, getTagBySlug } from "@/lib/supabase/queries/tags";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const tags = await getAllTags();
  return tags.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
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
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const posts = await getPostsByTag(slug);

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
