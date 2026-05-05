import type { Metadata } from "next";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { getAllPosts } from "@/lib/data/mock-posts";

export const metadata: Metadata = {
  title: "Home",
  description: "最新文章列表 — 技術筆記、開發心得與生活靈感。",
};

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <div>
      {posts.map((post) => (
        <ArticleCard key={post.id} post={post} />
      ))}
    </div>
  );
}
