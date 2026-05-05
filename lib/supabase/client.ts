"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Supabase 公開環境變數未設定：請確認 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY 已存在。本地寫入 .env.local；Vercel 在 Project Settings → Environment Variables 加入。",
  );
}

let cached: SupabaseClient | null = null;

/**
 * Browser-side Supabase client (僅供需要 realtime / 訂閱的 Client Component)
 * 一般資料獲取請走 Server Component + lib/supabase/server.ts。
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(url!, anonKey!);
  return cached;
}
