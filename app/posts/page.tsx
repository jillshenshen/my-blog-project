import type { Metadata } from "next";
import { PostGridCard } from "@/components/blog/PostGridCard";
import { getAllPosts } from "@/lib/supabase/queries/posts";

export const metadata: Metadata = {
  title: "Posts",
  description: "所有文章列表。",
};

export default async function PostsPage() {
  const posts = await getAllPosts();

  return (
    <div className="grid justify-center gap-x-2 gap-y-2 [grid-template-columns:repeat(auto-fill,250px)]">
      <header className="col-span-full mb-4 border-b border-[var(--color-border)] pb-4">
        <h1 className="text-xs tracking-[0.3em] text-muted uppercase">
          Posts
        </h1>
      </header>

      {posts.length === 0 ? (
        <p className="col-span-full py-20 text-center text-sm text-muted">
          目前還沒有文章。
        </p>
      ) : (
        posts.map((post) => <PostGridCard key={post.id} post={post} />)
      )}
    </div>
  );
}
