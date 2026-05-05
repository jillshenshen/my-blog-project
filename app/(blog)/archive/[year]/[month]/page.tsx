import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getArchive, getPostsByYearMonth } from "@/lib/supabase/queries/posts";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type Params = { year: string; month: string };

export async function generateStaticParams(): Promise<Params[]> {
  const out: Params[] = [];
  for (const entry of await getArchive()) {
    for (const m of entry.months) {
      out.push({
        year: String(entry.year),
        month: String(m.month).padStart(2, "0"),
      });
    }
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { year, month } = await params;
  const monthNum = Number(month);
  const monthName = MONTH_NAMES[monthNum - 1] ?? month;
  return {
    title: `${monthName} ${year}`,
    description: `${monthName} ${year} 發布的所有文章。`,
  };
}

export default async function ArchiveMonthPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { year, month } = await params;
  const yearNum = Number(year);
  const monthNum = Number(month);
  if (!Number.isFinite(yearNum) || !Number.isFinite(monthNum)) notFound();
  if (monthNum < 1 || monthNum > 12) notFound();

  const posts = await getPostsByYearMonth(yearNum, monthNum);
  if (posts.length === 0) notFound();

  const monthName = MONTH_NAMES[monthNum - 1];

  return (
    <>
      <SectionHeading className="pt-4">
        {monthName} {year}
      </SectionHeading>
      <div>
        {posts.map((post) => (
          <ArticleCard key={post.id} post={post} />
        ))}
      </div>
    </>
  );
}
