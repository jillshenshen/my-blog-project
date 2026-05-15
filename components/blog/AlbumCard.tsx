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
        {/* 左下角白字粗體標題（淡淡陰影避免在亮色封面上看不見） */}
        <div className="absolute bottom-2 left-3 right-3">
          <p className="truncate font-serif text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-xs">
            {album.title}
          </p>
        </div>
      </div>
    </Link>
  );
}
