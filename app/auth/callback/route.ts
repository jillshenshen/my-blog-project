import { NextResponse } from "next/server";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";

/**
 * Supabase OAuth callback handler.
 *
 * Flow：
 *  1. Client 呼叫 supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback?next=/posts/xxx' } })
 *  2. Google 授權後跳回 https://<supabase>.supabase.co/auth/v1/callback
 *  3. Supabase 設定 cookie 後再轉回我們這支 route，帶 ?code=xxx&next=...
 *  4. 我們用 exchangeCodeForSession(code) 換 session（PKCE flow）
 *  5. 回到 next 指定的頁面
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await getSupabaseServerWithAuth();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // redirect 回原本來源頁面
  return NextResponse.redirect(new URL(next, url.origin));
}
