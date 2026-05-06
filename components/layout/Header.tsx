import Link from "next/link";
import { Suspense } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SearchBar } from "@/components/layout/SearchBar";

const navItems: { label: string; href: string }[] = [
  { label: "HOME", href: "/" },
  { label: "POSTS", href: "/posts" },
  { label: "ALBUMS", href: "/albums" },
  { label: "ABOUT", href: "/about" },
];

export function Header() {
  return (
    <header className="bg-background">
      {/* Logo block — 大量留白 */}
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-24 sm:pb-20">
        <Link
          href="/"
          className="font-script text-6xl leading-none text-foreground sm:text-7xl md:text-8xl"
        >
          Jill&apos;s blog
        </Link>
        <p className="mt-6 text-[11px] tracking-[0.4em] text-accent uppercase">
          Higher Place Blog
        </p>
      </div>

      {/* Nav row — 上下細線對齊主內容區 (max-w-6xl + px-4/sm:px-6) */}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-3 border-y border-[var(--color-border)] py-5 sm:flex-row sm:justify-between sm:gap-6">
          <nav className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 sm:gap-x-14">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[11px] tracking-[0.3em] text-foreground transition hover:text-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Suspense fallback={<div className="h-8 w-9" />}>
              <SearchBar />
            </Suspense>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
