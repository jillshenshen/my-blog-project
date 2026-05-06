import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { getPostByIdForAdmin } from "@/lib/supabase/queries/admin-posts";
import { getAllCategories, getAllTags } from "@/lib/supabase/queries/tags";
import { updatePostAction } from "@/app/admin/(authed)/posts/actions";

export const metadata: Metadata = {
  title: "Edit Post",
  robots: { index: false, follow: false },
};

type Params = { id: string };
type SearchParams = { error?: string };

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [post, categories, tags] = await Promise.all([
    getPostByIdForAdmin(id),
    getAllCategories(),
    getAllTags(),
  ]);

  if (!post) notFound();

  return (
    <div>
      <header className="border-b border-[var(--color-border)] pb-6">
        <p className="text-[10px] tracking-[0.3em] text-muted uppercase">
          <Link href="/admin/posts" className="hover:text-foreground">
            ← Posts
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
          編輯：{post.title}
        </h1>
      </header>

      <div className="mt-8">
        <PostForm
          mode="edit"
          categories={categories}
          allTags={tags}
          initial={post}
          action={updatePostAction.bind(null, post.id)}
          errorMessage={error}
        />
      </div>
    </div>
  );
}
