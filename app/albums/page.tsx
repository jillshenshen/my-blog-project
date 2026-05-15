import type { Metadata } from "next";
import Link from "next/link";
import { AlbumCard } from "@/components/blog/AlbumCard";
import { getAlbumsPage } from "@/lib/supabase/queries/albums";

export const metadata: Metadata = {
  title: "Albums",
  description: "所有相簿列表。",
};

const PER_PAGE = 20;

type SearchParams = { page?: string };

export default async function AlbumsListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const pageNum = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { albums, totalPages, page } = await getAlbumsPage(pageNum, PER_PAGE);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="bg-[var(--color-border)] px-3 py-2 text-center sm:px-4">
        <h1 className="text-xs text-muted">Albums</h1>
      </header>

      {albums.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">目前還沒有相簿。</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="mt-10 flex items-center justify-center gap-4 text-[11px] tracking-[0.2em] uppercase">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const active = p === page;
            return (
              <Link
                key={p}
                href={p === 1 ? "/albums" : `/albums?page=${p}`}
                className={
                  active
                    ? "text-accent"
                    : "text-muted transition hover:text-foreground"
                }
              >
                {p}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
