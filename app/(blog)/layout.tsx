import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // (blog) 群組的頁面（首頁 / posts / tags / categories / archive / search）皆有側邊欄
  // 相簿不在此群組，使用 app/albums/layout.tsx（無側邊欄、滿版）
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-12">{children}</div>
          <Sidebar />
        </div>
      </main>
      <Footer />
    </>
  );
}
