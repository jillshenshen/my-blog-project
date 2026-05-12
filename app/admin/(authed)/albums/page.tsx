import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllAlbumsForAdmin } from "@/lib/supabase/queries/admin-albums";
import { formatDate } from "@/lib/utils/format";
import { DeleteAlbumButton } from "@/components/admin/DeleteAlbumButton";
import {
  deleteAlbumAction,
  toggleAlbumPublishAction,
} from "@/app/admin/(authed)/albums/actions";

export const metadata: Metadata = {
  title: "Albums",
  robots: { index: false, follow: false },
};

function isFutureIso(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

type SearchParams = { notice?: string; error?: string };

export default async function AdminAlbumsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { notice, error } = await searchParams;
  const albums = await getAllAlbumsForAdmin();

  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
            Albums
          </h1>
          <p className="mt-2 text-sm text-muted">
            管理所有相簿（含草稿）。建立後再上傳照片。
          </p>
        </div>
        <Link
          href="/admin/albums/new"
          className="inline-flex items-center self-start border border-[var(--color-accent)] px-5 py-2.5 text-[11px] tracking-[0.3em] text-accent uppercase transition hover:bg-[var(--color-accent)] hover:text-background sm:self-auto"
        >
          + 新增相簿
        </Link>
      </header>

      {notice ? (
        <p className="mt-4 border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 px-4 py-2 text-xs text-accent">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 border border-red-500/40 bg-red-500/5 px-4 py-2 text-xs text-red-500">
          {error}
        </p>
      ) : null}

      {albums.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">目前沒有相簿。</p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-border)]">
          {albums.map((album) => {
            const isScheduled =
              album.published && isFutureIso(album.publishedAt);
            const statusLabel = isScheduled
              ? "Scheduled"
              : album.published
                ? "Published"
                : "Draft";
            const statusClass = isScheduled
              ? "bg-amber-500/10 text-amber-500"
              : album.published
                ? "bg-[var(--color-accent)]/10 text-accent"
                : "bg-[var(--color-border)] text-muted";
            return (
              <li
                key={album.id}
                className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {album.coverImage ? (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden bg-[var(--color-border)]">
                      <Image
                        src={album.coverImage}
                        alt={album.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center bg-[var(--color-border)] text-[10px] tracking-[0.2em] text-muted uppercase">
                      No
                      <br />
                      Cover
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[9px] tracking-[0.2em] uppercase ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                      <Link
                        href={`/admin/albums/${album.id}/edit`}
                        className="truncate font-serif text-lg text-foreground hover:text-muted"
                      >
                        {album.title}
                      </Link>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">
                      <span className="font-mono">{album.slug}</span>
                      <span className="mx-2 text-subtle">·</span>
                      {album.imageCount} 張
                      <span className="mx-2 text-subtle">·</span>
                      {formatDate(album.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-4">
                  {album.published ? (
                    <Link
                      href={`/albums/${album.slug}`}
                      target="_blank"
                      className="text-[11px] tracking-[0.2em] text-muted uppercase hover:text-foreground"
                    >
                      View ↗
                    </Link>
                  ) : null}
                  <form
                    action={toggleAlbumPublishAction.bind(null, album.id)}
                  >
                    <button
                      type="submit"
                      className="cursor-pointer text-[11px] tracking-[0.2em] text-foreground uppercase transition hover:text-accent"
                    >
                      {album.published ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <Link
                    href={`/admin/albums/${album.id}/edit`}
                    className="text-[11px] tracking-[0.2em] text-foreground uppercase hover:text-accent"
                  >
                    Edit
                  </Link>
                  <DeleteAlbumButton
                    title={album.title}
                    action={deleteAlbumAction.bind(null, album.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
