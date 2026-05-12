import "server-only";
import type {
  Album,
  AlbumImage,
  AlbumWithImages,
} from "@/lib/types/album";
import { getSupabaseServer } from "@/lib/supabase/server";

type AlbumRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type AlbumImageRow = {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  taken_at: string | null;
  sort_order: number;
};

const ALBUM_SELECT =
  "id, title, slug, description, cover_image, published, published_at, created_at, updated_at";

const ALBUM_IMAGE_SELECT =
  "id, url, alt, caption, taken_at, sort_order";

function nowIso() {
  return new Date().toISOString();
}

function mapAlbumImage(row: AlbumImageRow): AlbumImage {
  return {
    id: row.id,
    url: row.url,
    alt: row.alt ?? "",
    caption: row.caption ?? "",
    takenAt: row.taken_at,
    sortOrder: row.sort_order,
  };
}

function mapAlbum(row: AlbumRow, imageCount: number): Album {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    coverImage: row.cover_image ?? "",
    published: row.published,
    publishedAt: row.published_at ?? row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    imageCount,
  };
}

export async function getAllAlbums(): Promise<Album[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("albums")
    .select(`${ALBUM_SELECT}, album_images(count)`)
    .eq("published", true)
    .lte("published_at", nowIso())
    .order("published_at", { ascending: false });

  if (error) throw error;
  type RowWithCount = AlbumRow & { album_images: { count: number }[] };
  return (data as unknown as RowWithCount[]).map((row) =>
    mapAlbum(row, row.album_images?.[0]?.count ?? 0),
  );
}

export type AlbumPage = {
  albums: Album[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export async function getAlbumsPage(
  page: number,
  perPage: number,
): Promise<AlbumPage> {
  const supabase = getSupabaseServer();
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from("albums")
    .select(`${ALBUM_SELECT}, album_images(count)`, { count: "exact" })
    .eq("published", true)
    .lte("published_at", nowIso())
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  type RowWithCount = AlbumRow & { album_images: { count: number }[] };
  const albums = (data as unknown as RowWithCount[]).map((row) =>
    mapAlbum(row, row.album_images?.[0]?.count ?? 0),
  );
  const total = count ?? 0;
  return {
    albums,
    total,
    page: safePage,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getAlbumBySlug(
  slug: string,
): Promise<AlbumWithImages | null> {
  const supabase = getSupabaseServer();
  const { data: albumRow, error: e1 } = await supabase
    .from("albums")
    .select(ALBUM_SELECT)
    .eq("slug", slug)
    .eq("published", true)
    .lte("published_at", nowIso())
    .maybeSingle();

  if (e1) throw e1;
  if (!albumRow) return null;

  const album = albumRow as unknown as AlbumRow;

  const { data: imgRows, error: e2 } = await supabase
    .from("album_images")
    .select(ALBUM_IMAGE_SELECT)
    .eq("album_id", album.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (e2) throw e2;
  const images = (imgRows as unknown as AlbumImageRow[]).map(mapAlbumImage);

  return {
    ...mapAlbum(album, images.length),
    images,
  };
}
