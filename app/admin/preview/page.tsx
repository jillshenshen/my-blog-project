import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";
import { PreviewClient } from "./PreviewClient";

export const metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default function PreviewPage() {
  return (
    <>
      {/* 警示 bar — 固定在最上方 */}
      <div className="sticky top-0 z-50 border-b border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-4 py-2 text-center text-[11px] tracking-[0.3em] text-accent uppercase">
        Preview Mode · 此頁面僅供本機預覽，未真正發布
      </div>

      {/* 比照 (blog)/layout.tsx：Header + max-w-6xl 主內容區 + Sidebar + Footer */}
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-12">
            <Suspense
              fallback={
                <p className="text-center text-sm text-muted">載入中…</p>
              }
            >
              <PreviewClient />
            </Suspense>
          </div>
          <Sidebar />
        </div>
      </main>
      <Footer />
    </>
  );
}
