import Image from "next/image";
import Link from "next/link";
import type { Album } from "@/lib/types/album";

type Props = {
  album: Album;
};

export function AlbumCard({ album }: Props) {
  return (
    <Link
      href={`/albums/${album.slug}`}
      className="group block text-center"
    >
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
      </div>
      <p className="mt-3 px-1 font-serif text-sm text-foreground transition group-hover:text-muted sm:text-base">
        {album.title}
      </p>
    </Link>
  );
}
