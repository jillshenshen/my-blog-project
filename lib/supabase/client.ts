/**
 * Browser-side Supabase client (尚未接線)
 *
 * 僅供需要 realtime / 訂閱等特殊互動的 Client Component 使用，
 * 一般資料獲取請走 Server Component + lib/supabase/server.ts。
 */

export function createBrowserSupabaseClient(): never {
  throw new Error(
    "Supabase browser client 尚未實作。請先設定 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY，再安裝 @supabase/ssr。",
  );
}
