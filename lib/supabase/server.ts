/**
 * Server-side Supabase client (尚未接線)
 *
 * Phase 1 暫時使用 lib/data/mock-posts.ts。
 * 待環境變數設定完成後，安裝 @supabase/ssr + @supabase/supabase-js，
 * 並於此匯出 createServerClient() 供 Server Component / Server Action 使用。
 */

export function createServerSupabaseClient(): never {
  throw new Error(
    "Supabase server client 尚未實作。請先設定 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY，再安裝 @supabase/ssr。",
  );
}
