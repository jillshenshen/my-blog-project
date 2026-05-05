"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="flex h-8 w-56 items-center gap-2 rounded-full border border-[var(--color-border)] bg-surface px-3"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-4 w-4 text-muted"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path strokeLinecap="round" d="m20 20-3.5-3.5" />
      </svg>
      <input
        key={initial}
        type="search"
        name="q"
        defaultValue={initial}
        placeholder="搜尋文章..."
        aria-label="搜尋文章"
        className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
      />
    </form>
  );
}
