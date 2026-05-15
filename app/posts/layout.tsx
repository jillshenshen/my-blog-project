import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PostsListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // /posts 列表頁滿版（無側邊欄）
  // 注意：/posts/[slug] 仍在 app/(blog)/ 群組，會有 sidebar
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
