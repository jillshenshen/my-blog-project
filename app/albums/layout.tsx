import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function AlbumsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 相簿頁面滿版（無側邊欄、無音樂播放器），給 grid / 燈箱更多空間
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
