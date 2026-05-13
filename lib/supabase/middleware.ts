import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 後台 email 白名單。逗號分隔；未設定時退回「任何已登入者皆視為 admin」
// （和 Google OAuth 一併啟用後，務必設定此變數避免任何讀者登入後也能進 /admin）
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function isAdminUser(email: string | null | undefined): boolean {
  if (ADMIN_EMAILS.length === 0) return true; // 未設定白名單：保持向後相容
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // 觸發 session 更新（cookies 自動續期）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminPath = path.startsWith("/admin");
  const isLoginPath = path === "/admin/login";
  const isAdmin = user ? isAdminUser(user.email) : false;

  // 未登入 / 非 admin email 存取 /admin/* (除了 /admin/login) → 跳轉登入
  if (isAdminPath && !isLoginPath && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  // 已是 admin 但訪問 /admin/login → 跳回 dashboard
  if (isLoginPath && isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.delete("redirectTo");
    return NextResponse.redirect(url);
  }

  return response;
}
