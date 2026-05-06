import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

type SearchParams = { error?: string; redirectTo?: string };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, redirectTo } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Link
            href="/"
            className="font-script text-4xl text-foreground sm:text-5xl"
          >
            Jill&apos;s blog
          </Link>
          <p className="mt-3 text-[10px] tracking-[0.4em] text-accent uppercase">
            Admin
          </p>
        </div>

        <form action={loginAction} className="mt-12 space-y-5">
          <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-[10px] tracking-[0.3em] text-muted uppercase"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              className="h-10 w-full border-b border-[var(--color-border)] bg-transparent px-1 text-sm text-foreground outline-none transition focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-[10px] tracking-[0.3em] text-muted uppercase"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-10 w-full border-b border-[var(--color-border)] bg-transparent px-1 text-sm text-foreground outline-none transition focus:border-[var(--color-accent)]"
            />
          </div>

          {error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : null}

          <button
            type="submit"
            className="mt-4 inline-flex h-10 w-full cursor-pointer items-center justify-center border border-[var(--color-accent)] text-xs tracking-[0.3em] text-accent uppercase transition hover:bg-[var(--color-accent)] hover:text-background"
          >
            Sign In
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] tracking-[0.25em] text-subtle uppercase">
          <Link href="/" className="hover:text-foreground">
            ← Back to blog
          </Link>
        </p>
      </div>
    </main>
  );
}
