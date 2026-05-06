import type { Metadata } from "next";
import Link from "next/link";
import { PostForm } from "@/components/admin/PostForm";
import { getAllCategories, getAllTags } from "@/lib/supabase/queries/tags";
import { createPostAction } from "@/app/admin/(authed)/posts/actions";

export const metadata: Metadata = {
  title: "New Post",
  robots: { index: false, follow: false },
};

type SearchParams = { error?: string };

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;
  const [categories, tags] = await Promise.all([
    getAllCategories(),
    getAllTags(),
  ]);

  return (
    <div>
      <header className="border-b border-[var(--color-border)] pb-6">
        <p className="text-[10px] tracking-[0.3em] text-muted uppercase">
          <Link href="/admin/posts" className="hover:text-foreground">
            ← Posts
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
          新增文章
        </h1>
      </header>

      <div className="mt-8">
        <PostForm
          mode="new"
          categories={categories}
          allTags={tags}
          action={createPostAction}
          errorMessage={error}
        />
      </div>
    </div>
  );
}
