import { AlbumCardSkeleton } from "@/components/blog/AlbumCardSkeleton";

const PLACEHOLDER_COUNT = 10;

export default function AlbumsLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="bg-[var(--color-border)] px-3 py-2 text-center sm:px-4">
        <h1 className="text-xs text-muted">Albums</h1>
      </header>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
          <AlbumCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
