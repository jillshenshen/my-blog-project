import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "找不到頁面",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="font-serif text-7xl italic text-foreground">404</p>
      <h1 className="text-lg text-foreground">這裡什麼都沒有</h1>
      <p className="max-w-md text-sm text-muted">
        你要找的頁面可能被搬走、改名或從未存在過。
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="border border-foreground px-6 py-2 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background"
        >
          回首頁
        </Link>
        <Link
          href="/posts"
          className="border border-[var(--color-border)] px-6 py-2 text-[11px] tracking-[0.3em] text-muted uppercase transition hover:border-foreground hover:text-foreground"
        >
          看文章列表
        </Link>
      </div>
    </div>
  );
}
