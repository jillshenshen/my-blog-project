import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Supabase 環境變數未設定：請確認 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY 已存在。",
  );
}

/**
 * Cookie-aware Supabase client (Server Components / Server Actions / Route Handlers)
 *
 * 用於需要讀取或修改使用者 session 的場景：
 * - 後台 page.tsx：getUser() 顯示登入者資訊
 * - login server action：signInWithPassword()
 * - logout server action：signOut()
 *
 * 一般公開讀取（前台文章列表）請改用 lib/supabase/server.ts (anon, no cookies)。
 */
export async function getSupabaseServerWithAuth(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }: {
              name: string;
              value: string;
              options: CookieOptions;
            }) => cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component 中無法寫 cookie，由 middleware 接手即可
        }
      },
    },
  });
}
