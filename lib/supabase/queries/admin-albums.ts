import "server-only";
import type {
  Album,
  AlbumImage,
  AlbumWithImages,
} from "@/lib/types/album";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type AdminAlbumRow = {
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

type AdminAlbumImageRow = {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  taken_at: string | null;
  sort_order: number;
};

const ADMIN_ALBUM_SELECT =
  "id, title, slug, description, cover_image, published, published_at, created_at, updated_at";

const ADMIN_ALBUM_IMAGE_SELECT =
  "id, url, alt, caption, taken_at, sort_order";

function mapAlbumImage(row: AdminAlbumImageRow): AlbumImage {
  return {
    id: row.id,
    url: row.url,
    alt: row.alt ?? "",
    caption: row.caption ?? "",
    takenAt: row.taken_at,
    sortOrder: row.sort_order,
  };
}

function mapAdminAlbum(row: AdminAlbumRow, imageCount: number): Album {
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

export async function getAllAlbumsForAdmin(): Promise<Album[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("albums")
    .select(`${ADMIN_ALBUM_SELECT}, album_images(count)`)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  type RowWithCount = AdminAlbumRow & { album_images: { count: number }[] };
  return (data as unknown as RowWithCount[]).map((row) =>
    mapAdminAlbum(row, row.album_images?.[0]?.count ?? 0),
  );
}

export async function getAlbumByIdForAdmin(
  id: string,
): Promise<AlbumWithImages | null> {
  const supabase = getSupabaseAdmin();
  const { data: albumRow, error: e1 } = await supabase
    .from("albums")
    .select(ADMIN_ALBUM_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (e1) throw e1;
  if (!albumRow) return null;

  const album = albumRow as unknown as AdminAlbumRow;

  const { data: imgRows, error: e2 } = await supabase
    .from("album_images")
    .select(ADMIN_ALBUM_IMAGE_SELECT)
    .eq("album_id", album.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (e2) throw e2;
  const images = (imgRows as unknown as AdminAlbumImageRow[]).map(
    mapAlbumImage,
  );

  return {
    ...mapAdminAlbum(album, images.length),
    images,
  };
}

export async function isAlbumSlugTaken(
  slug: string,
  excludeAlbumId?: string,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("albums")
    .select("id")
    .eq("slug", slug)
    .limit(1);
  if (excludeAlbumId) query = query.neq("id", excludeAlbumId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).length > 0;
}
