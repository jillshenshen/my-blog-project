import type { Metadata } from "next";
import { TaxonomyList } from "@/components/blog/TaxonomyList";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getAllCategories } from "@/lib/supabase/queries/tags";

export const metadata: Metadata = {
  title: "Categories",
  description: "所有文章分類。",
};

export default async function CategoriesIndexPage() {
  const categories = await getAllCategories();
  return (
    <section className="border border-[var(--color-border)] bg-surface px-6 py-10 sm:px-12 sm:py-14">
      <SectionHeading>All Categories</SectionHeading>
      <div className="mt-8">
        <TaxonomyList items={categories} basePath="/categories" />
      </div>
    </section>
  );
}
