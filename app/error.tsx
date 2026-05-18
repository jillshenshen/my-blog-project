"use client";

import { useEffect } from "react";
import Link from "next/link";

// 全域 error boundary — 攔截 server / client 端未捕捉的例外
// 必須是 client component，會收到 error + reset props
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 之後接 Sentry / Logflare 等可在這裡上報
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="font-serif text-6xl italic text-foreground">Oops</p>
      <h1 className="text-lg text-foreground">頁面發生了一點問題</h1>
      <p className="max-w-md text-sm text-muted">
        系統好像卡住了。可以試著重新整理這一頁，或回首頁逛逛。
      </p>
      {error.digest ? (
        <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
          error id: {error.digest}
        </p>
      ) : null}
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer border border-foreground px-6 py-2 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background"
        >
          再試一次
        </button>
        <Link
          href="/"
          className="border border-[var(--color-border)] px-6 py-2 text-[11px] tracking-[0.3em] text-muted uppercase transition hover:border-foreground hover:text-foreground"
        >
          回首頁
        </Link>
      </div>
    </div>
  );
}
