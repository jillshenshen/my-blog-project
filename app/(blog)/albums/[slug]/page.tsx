import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumLightbox } from "@/components/blog/AlbumLightbox";
import { getAlbumBySlug, getAllAlbums } from "@/lib/supabase/queries/albums";
import { decodeParam } from "@/lib/utils/decode-param";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const albums = await getAllAlbums();
    return albums.map((a) => ({ slug: a.slug }));
  } catch {
    // migration 還沒跑 / albums 表不存在時，退回完全動態渲染
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const album = await getAlbumBySlug(slug);
  if (!album) return { title: "Not Found" };

  return {
    title: album.title,
    description: album.description || `${album.title} 相簿`,
    openGraph: {
      title: album.title,
      description: album.description,
      type: "website",
      images: album.coverImage ? [{ url: album.coverImage }] : undefined,
    },
  };
}

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const album = await getAlbumBySlug(slug);
  if (!album) notFound();

  return (
    <article>
      <header className="border-b border-[var(--color-border)] pb-6">
        <p className="text-[10px] tracking-[0.3em] text-muted uppercase">
          <Link href="/albums" className="hover:text-foreground">
            ← Albums
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
          {album.title}
        </h1>
        {album.description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            {album.description}
          </p>
        ) : null}
        <p className="mt-3 text-[10px] tracking-[0.3em] text-subtle uppercase">
          {album.imageCount} Photos
        </p>
      </header>

      <div className="mt-8">
        {album.images.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted">
            這本相簿還沒有照片。
          </p>
        ) : (
          <AlbumLightbox images={album.images} />
        )}
      </div>
    </article>
  );
}
