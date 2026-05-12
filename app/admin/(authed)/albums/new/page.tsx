import type { Metadata } from "next";
import Link from "next/link";
import { AlbumForm } from "@/components/admin/AlbumForm";
import { createAlbumAction } from "@/app/admin/(authed)/albums/actions";

export const metadata: Metadata = {
  title: "New Album",
  robots: { index: false, follow: false },
};

type SearchParams = { error?: string };

export default async function NewAlbumPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <header className="border-b border-[var(--color-border)] pb-6">
        <p className="text-[10px] tracking-[0.3em] text-muted uppercase">
          <Link href="/admin/albums" className="hover:text-foreground">
            ← Albums
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
          新增相簿
        </h1>
        <p className="mt-2 text-sm text-muted">
          先建立相簿基本資訊，建立後再進入編輯頁上傳照片。
        </p>
      </header>

      <div className="mt-8 max-w-3xl">
        <AlbumForm
          mode="new"
          action={createAlbumAction}
          errorMessage={error}
        />
      </div>
    </div>
  );
}
