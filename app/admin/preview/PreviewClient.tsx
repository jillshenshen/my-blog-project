"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PostArticle,
  type PostArticleData,
} from "@/components/blog/PostArticle";

export function PreviewClient() {
  const params = useSearchParams();
  const key = params.get("key");
  const [data, setData] = useState<PostArticleData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 先做 external read（讓 lint rule 知道這個 effect 是在 sync localStorage）
    let raw: string | null = null;
    try {
      raw = key ? localStorage.getItem(`post-preview-${key}`) : null;
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("讀取 localStorage 失敗");
      return;
    }

    if (!key) {
      setError("缺少 preview key");
      return;
    }
    if (!raw) {
      setError("找不到預覽資料（可能已過期或在其他瀏覽器存的）");
      return;
    }
    try {
      setData(JSON.parse(raw) as PostArticleData);
    } catch {
      setError("預覽資料解析失敗");
    }
  }, [key]);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-4 py-2 text-center text-[11px] tracking-[0.3em] text-accent uppercase">
        Preview Mode · 此頁面僅供本機預覽，未真正發布
      </div>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        {error ? (
          <div className="border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        ) : data ? (
          <PostArticle post={data} isPreview />
        ) : (
          <p className="text-center text-sm text-muted">載入中…</p>
        )}
      </main>
    </div>
  );
}
