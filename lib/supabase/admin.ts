import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Supabase admin client 缺少憑證：請確認 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY 已設定（本地寫入 .env.local；Vercel 在 Settings → Environment Variables）。",
  );
}

let cached: SupabaseClient | null = null;

/**
 * Service Role Supabase client (server-only, bypass RLS)
 *
 * 用於後台管理員「以管理身分」對資料表寫入：
 * - 新增 / 編輯 / 刪除文章
 * - 上傳封面圖到 Storage
 * - 寫入 site_settings
 *
 * 注意：service role key 擁有最高權限，僅可在 Server Action / Route Handler / API route
 * 使用，不能洩漏到 client bundle。本檔案 import 'server-only' 強制檢查。
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
