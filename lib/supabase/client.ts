"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Supabase 公開環境變數未設定：請確認 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY 已存在。本地寫入 .env.local；Vercel 在 Project Settings → Environment Variables 加入。",
  );
}

let cached: SupabaseClient | null = null;

/**
 * Browser-side Supabase client（cookie-aware，與 server actions 共用 session）
 *
 * 使用 @supabase/ssr 的 createBrowserClient，所以 OAuth / signInWithPassword 設下的
 * session cookie 會自動同步給 server actions（透過 getSupabaseServerWithAuth）。
 *
 * 一般資料獲取仍請走 Server Component + lib/supabase/server.ts。
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (cached) return cached;
  cached = createBrowserClient(url!, anonKey!);
  return cached;
}
