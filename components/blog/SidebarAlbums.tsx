import Image from "next/image";
import Link from "next/link";
import type { Album } from "@/lib/types/album";

type Props = {
  albums: Album[];
};

export function SidebarAlbums({ albums }: Props) {
  // 取最新 9 本相簿做九宮格；不足 9 張的補空白格
  const slots = albums.slice(0, 9);
  const fillers = Math.max(0, 9 - slots.length);

  return (
    <div className="grid aspect-square grid-cols-3">
      {slots.map((album) => (
        <Link
          key={album.id}
          href={`/albums/${album.slug}`}
          className="group relative block aspect-square overflow-hidden bg-[var(--color-border)]"
          title={album.title}
        >
          {album.coverImage ? (
            <Image
              src={album.coverImage}
              alt={album.title}
              fill
              sizes="120px"
              className="object-cover transition duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[8px] tracking-[0.2em] text-muted uppercase">
              No Cover
            </div>
          )}
        </Link>
      ))}
      {Array.from({ length: fillers }).map((_, i) => (
        <div
          key={`filler-${i}`}
          className="aspect-square bg-[var(--color-border)]/40"
        />
      ))}
    </div>
  );
}
