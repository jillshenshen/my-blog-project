import type { Metadata } from "next";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { getAllPosts } from "@/lib/supabase/queries/posts";

export const metadata: Metadata = {
  title: "Posts",
  description: "所有文章列表。",
};

export default async function PostsPage() {
  const posts = await getAllPosts();
  return (
    <div>
      {posts.map((post) => (
        <ArticleCard key={post.id} post={post} />
      ))}
    </div>
  );
}
