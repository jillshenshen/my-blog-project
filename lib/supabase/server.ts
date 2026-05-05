import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Supabase 環境變數未設定：請確認 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY 已寫入 .env.local。",
  );
}

let cached: SupabaseClient | null = null;

/**
 * Server-side Supabase client (Phase 1：僅做公開讀取)
 *
 * 走 anon key + RLS 公開政策，不涉及登入狀態。
 * Phase 2 加管理後台時，另外建立 service role / cookie-aware client。
 */
export function getSupabaseServer(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(url!, anonKey!, {
    auth: { persistSession: false },
  });
  return cached;
}
