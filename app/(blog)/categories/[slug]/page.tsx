import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPostsByCategory } from "@/lib/supabase/queries/posts";
import {
  getAllCategories,
  getCategoryBySlug,
} from "@/lib/supabase/queries/tags";
import { decodeParam } from "@/lib/utils/decode-param";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const categories = await getAllCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Not Found" };
  return {
    title: category.name,
    description: `分類為 ${category.name} 的所有文章。`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const posts = await getPostsByCategory(slug);

  return (
    <>
      <SectionHeading className="pt-4">{category.name}</SectionHeading>
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
