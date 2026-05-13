"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { User } from "@supabase/supabase-js";
import { createCommentAction } from "@/app/(blog)/posts/[slug]/comments-actions";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Props = {
  postSlug: string;
  parentId?: string | null;
  onSuccess?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
};

type AuthUserInfo = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

function extractAuthInfo(user: User): AuthUserInfo {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Google User";
  const avatar =
    (meta.avatar_url as string | undefined) ||
    (meta.picture as string | undefined) ||
    null;
  return {
    id: user.id,
    name,
    email: user.email ?? "",
    avatar,
  };
}

export function CommentForm({
  postSlug,
  parentId = null,
  onSuccess,
  autoFocus = false,
  compact = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUserInfo | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let alive = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setAuthUser(data.user ? extractAuthInfo(data.user) : null);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ? extractAuthInfo(session.user) : null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    const supabase = getSupabaseBrowser();
    const origin = window.location.origin;
    const next = `${pathname}#comments`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  async function signOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.refresh();
  }

  function handleAction(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await createCommentAction(postSlug, parentId, formData);
      if (result.ok) {
        formRef.current?.reset();
        onSuccess?.();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const containerClass = compact
    ? "space-y-3 border border-[var(--color-border)] p-4"
    : "space-y-3 border border-[var(--color-border)] p-5";

  return (
    <form ref={formRef} action={handleAction} className={containerClass}>
      {/* honeypot：隱藏欄位，機器人才會填 */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {/* 身份區塊：登入時顯示頭像 + 名字 + 登出；未登入顯示 Google 登入 + 匿名表單 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {authReady && authUser ? (
          <div className="flex items-center gap-3">
            {authUser.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={authUser.avatar}
                alt={authUser.name}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <div className="text-xs">
              <span className="text-foreground">{authUser.name}</span>
              <span className="ml-2 text-[10px] tracking-[0.2em] text-accent uppercase">
                ✓ Verified
              </span>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="ml-2 cursor-pointer text-[10px] tracking-[0.2em] text-muted uppercase transition hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={!authReady}
            className="inline-flex cursor-pointer items-center gap-2 border border-[var(--color-border)] px-3 py-1.5 text-[11px] tracking-[0.2em] text-foreground uppercase transition hover:border-foreground disabled:cursor-default disabled:opacity-50"
          >
            <span aria-hidden>G</span>
            <span>Sign in with Google</span>
          </button>
        )}
      </div>

      {/* 未登入才顯示 name / email 欄位 */}
      {authReady && !authUser ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
              暱稱
            </span>
            <input
              name="name"
              type="text"
              required
              maxLength={50}
              autoFocus={autoFocus}
              className="mt-1 w-full border border-[var(--color-border)] bg-background px-2 py-1.5 text-sm text-foreground focus:border-foreground focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
              Email（不公開）
            </span>
            <input
              name="email"
              type="email"
              required
              maxLength={200}
              className="mt-1 w-full border border-[var(--color-border)] bg-background px-2 py-1.5 text-sm text-foreground focus:border-foreground focus:outline-none"
            />
          </label>
        </div>
      ) : null}

      <label className="block">
        <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
          留言內容
        </span>
        <textarea
          name="content"
          required
          maxLength={2000}
          rows={compact ? 3 : 5}
          autoFocus={autoFocus && !!authUser}
          className="mt-1 w-full border border-[var(--color-border)] bg-background px-2 py-1.5 text-sm leading-relaxed text-foreground focus:border-foreground focus:outline-none"
        />
      </label>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !authReady}
          className="cursor-pointer border border-foreground px-5 py-2 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background disabled:cursor-default disabled:opacity-50"
        >
          {pending ? "送出中…" : "送出留言"}
        </button>
      </div>
    </form>
  );
}
