"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const STORAGE_KEY = "admin_sidebar_open";

const NAV_ITEMS: {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
}[] = [
  { href: "/admin", label: "Dashboard", match: (p) => p === "/admin" },
  {
    href: "/admin/posts",
    label: "Posts",
    match: (p) => p.startsWith("/admin/posts"),
  },
  {
    href: "/admin/albums",
    label: "Albums",
    match: (p) => p.startsWith("/admin/albums"),
  },
  {
    href: "/admin/comments",
    label: "Comments",
    match: (p) => p.startsWith("/admin/comments"),
  },
  {
    href: "/admin/categories",
    label: "Categories",
    match: (p) => p.startsWith("/admin/categories"),
  },
  {
    href: "/admin/tags",
    label: "Tags",
    match: (p) => p.startsWith("/admin/tags"),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    match: (p) => p.startsWith("/admin/settings"),
  },
];

type Props = {
  siteTitle: string;
  userEmail: string;
  children: React.ReactNode;
};

export function AdminShell({ siteTitle, userEmail, children }: Props) {
  // 初始 false，避免 SSR / hydration mismatch；mount 後再讀 localStorage / media query
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // mount 後同步 localStorage / media query 的 hydration 後處理
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setOpen(true);
    else if (stored === "0") setOpen(false);
    else setOpen(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  }, [open, mounted]);

  function closeOnMobile() {
    if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 transform border-r border-[var(--color-border)] bg-background transition-transform duration-200 md:static ${
          open
            ? "translate-x-0"
            : "-translate-x-full md:hidden md:translate-x-0"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <Link
            href="/admin"
            onClick={closeOnMobile}
            className="font-script text-xl text-foreground"
          >
            {siteTitle}
          </Link>
          <span className="hidden text-[9px] tracking-[0.3em] text-accent uppercase sm:inline">
            Admin
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="關閉側邊欄"
            className="cursor-pointer text-xl text-muted transition hover:text-foreground md:hidden"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col p-3">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeOnMobile}
                className={`px-3 py-2.5 text-xs tracking-[0.2em] uppercase transition ${
                  active
                    ? "bg-[var(--color-border)] text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--color-border)] p-3">
          <Link
            href="/"
            target="_blank"
            className="block px-3 py-2 text-[10px] tracking-[0.3em] text-muted uppercase transition hover:text-foreground"
          >
            View Site ↗
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open ? (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-hidden
        />
      ) : null}

      {/* Content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[var(--color-border)] bg-background">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? "關閉側邊欄" : "打開側邊欄"}
                aria-expanded={open}
                className="cursor-pointer text-2xl leading-none text-foreground transition hover:text-muted"
              >
                ☰
              </button>
              <span className="text-[10px] tracking-[0.3em] text-accent uppercase">
                Admin
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden text-xs text-muted sm:inline">
                {userEmail}
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="cursor-pointer text-[11px] tracking-[0.2em] text-foreground uppercase transition hover:text-accent"
                >
                  Logout
                </button>
              </form>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
