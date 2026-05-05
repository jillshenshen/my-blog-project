import type { Metadata } from "next";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { searchPosts } from "@/lib/supabase/queries/posts";

type SearchParams = { q?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `搜尋：${q}` : "搜尋",
    description: "搜尋部落格文章",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchPosts(query) : [];

  return (
    <>
      <section className="border-b border-[var(--color-border)] px-6 py-10 text-center sm:px-12 sm:py-14">
        <SectionHeading>Search</SectionHeading>
        {query ? (
          <p className="mt-6 text-sm text-muted">
            關鍵字「<span className="text-foreground">{query}</span>」共找到{" "}
            <span className="text-foreground">{results.length}</span> 篇文章
          </p>
        ) : (
          <p className="mt-6 text-sm text-muted">請在上方搜尋框輸入關鍵字</p>
        )}
      </section>

      <div>
        {results.map((post) => (
          <ArticleCard key={post.id} post={post} />
        ))}
      </div>
    </>
  );
}
