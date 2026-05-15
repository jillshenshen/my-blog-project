import Image from "next/image";
import Link from "next/link";
import type { Album } from "@/lib/types/album";

type Props = {
  album: Album;
};

export function AlbumCard({ album }: Props) {
  return (
    <Link href={`/albums/${album.slug}`} className="group block">
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-border)]">
        {album.coverImage ? (
          <Image
            src={album.coverImage}
            alt={album.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] tracking-[0.3em] text-muted uppercase">
            No Cover
          </div>
        )}
        {/* 底邊白字標題（淡淡陰影避免在亮色封面上看不見） */}
        <div className="absolute inset-x-0 bottom-0 px-3 py-2">
          <p className="truncate text-center font-serif text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-sm">
            {album.title}
          </p>
        </div>
      </div>
    </Link>
  );
}
