import { SectionHeading } from "@/components/ui/SectionHeading";
import { RecentPosts } from "@/components/blog/RecentPosts";
import { TaxonomyList } from "@/components/blog/TaxonomyList";
import { BlogArchive } from "@/components/blog/BlogArchive";
import {
  getAllCategories,
  getAllTags,
  getArchive,
  getRecentPosts,
} from "@/lib/data/mock-posts";

export function Sidebar() {
  const recent = getRecentPosts(5);
  const categories = getAllCategories();
  const tags = getAllTags();
  const archive = getArchive();

  return (
    <aside className="space-y-10">
      <section className="border border-[var(--color-border)] bg-surface px-6 py-8">
        <SectionHeading>About me</SectionHeading>
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="h-32 w-32 rounded-full bg-[var(--color-border)]" />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Hi，這裡是個人技術部落格，記錄學習筆記、開發心得與生活靈感。
          </p>
          <a
            href="/about"
            className="mt-3 font-serif text-sm italic text-foreground hover:text-muted"
          >
            Read More
          </a>
        </div>
      </section>

      <section className="border border-[var(--color-border)] bg-surface px-6 py-8">
        <SectionHeading>Recent posts</SectionHeading>
        <div className="mt-6">
          <RecentPosts posts={recent} />
        </div>
      </section>

      <section className="border border-[var(--color-border)] bg-surface px-6 py-8">
        <SectionHeading>Blog Archive</SectionHeading>
        <div className="mt-6">
          <BlogArchive entries={archive} />
        </div>
      </section>

      <section className="border border-[var(--color-border)] bg-surface px-6 py-8">
        <SectionHeading>Categories</SectionHeading>
        <div className="mt-6">
          <TaxonomyList items={categories} basePath="/categories" />
        </div>
      </section>

      <section className="border border-[var(--color-border)] bg-surface px-6 py-8">
        <SectionHeading>Tags</SectionHeading>
        <div className="mt-6">
          <TaxonomyList items={tags} basePath="/tags" />
        </div>
      </section>
    </aside>
  );
}
