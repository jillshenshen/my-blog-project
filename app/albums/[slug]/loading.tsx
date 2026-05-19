import Link from "next/link";

const PHOTO_PLACEHOLDER_COUNT = 10;

export default function AlbumDetailLoading() {
  return (
    <article className="mx-auto max-w-4xl">
      <header className="border-b border-[var(--color-border)] pb-6">
        <p className="text-[10px] tracking-[0.3em] text-muted uppercase">
          <Link href="/albums" className="hover:text-foreground">
            ← Albums
          </Link>
        </p>
        <div className="skeleton-shimmer mt-3 h-6 w-2/3 sm:h-7" />
        <div className="mt-4 space-y-2">
          <div className="skeleton-shimmer h-3 w-full max-w-2xl" />
          <div className="skeleton-shimmer h-3 w-4/5 max-w-2xl" />
        </div>
        <div className="skeleton-shimmer mt-4 h-2.5 w-20" />
      </header>

      <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: PHOTO_PLACEHOLDER_COUNT }, (_, i) => (
          <li key={i}>
            <div className="skeleton-shimmer aspect-square w-full" />
          </li>
        ))}
      </ul>
    </article>
  );
}
