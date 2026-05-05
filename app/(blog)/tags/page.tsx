import type { Metadata } from "next";
import { TaxonomyList } from "@/components/blog/TaxonomyList";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getAllTags } from "@/lib/supabase/queries/tags";

export const metadata: Metadata = {
  title: "Tags",
  description: "所有文章標籤。",
};

export default async function TagsIndexPage() {
  const tags = await getAllTags();
  return (
    <section className="border border-[var(--color-border)] bg-surface px-6 py-10 sm:px-12 sm:py-14">
      <SectionHeading>All Tags</SectionHeading>
      <div className="mt-8">
        <TaxonomyList items={tags} basePath="/tags" />
      </div>
    </section>
  );
}
