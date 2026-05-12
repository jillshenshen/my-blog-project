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
    <div>
      <header className="border-b border-[var(--color-border)] pb-6">
        <p className="text-[10px] tracking-[0.3em] text-muted uppercase">
          Albums
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground sm:text-4xl">
          相簿
        </h1>
      </header>

      {albums.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">目前還沒有相簿。</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="mt-12 flex items-center justify-center gap-4 text-[11px] tracking-[0.2em] uppercase">
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
