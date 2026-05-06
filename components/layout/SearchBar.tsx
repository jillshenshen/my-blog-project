"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [expanded, setExpanded] = useState(initial.length > 0);
  const inputRef = useRef<HTMLInputElement>(null);

  function expand() {
    setExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onIconClick() {
    if (!expanded) {
      expand();
      return;
    }
    inputRef.current?.form?.requestSubmit();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (e.target.value === "") {
      setExpanded(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.currentTarget.value = "";
      e.currentTarget.blur();
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="flex items-center justify-end"
    >
      <input
        ref={inputRef}
        key={initial}
        type="search"
        name="q"
        defaultValue={initial}
        placeholder="搜尋..."
        aria-label="搜尋文章"
        aria-hidden={!expanded}
        tabIndex={expanded ? 0 : -1}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={`h-8 bg-transparent text-sm text-foreground outline-none placeholder:text-subtle transition-all duration-300 ease-out ${
          expanded
            ? "w-48 border-b border-[var(--color-border)] px-2 sm:w-56"
            : "w-0 border-b border-transparent px-0"
        }`}
      />
      <button
        type="button"
        onClick={onIconClick}
        aria-label={expanded ? "送出搜尋" : "開啟搜尋"}
        aria-expanded={expanded}
        className="ml-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center text-foreground transition hover:text-muted"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}
