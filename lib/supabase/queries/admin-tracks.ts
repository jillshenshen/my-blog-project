import "server-only";
import type { Track } from "@/lib/types/track";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type AdminTrackRow = {
  id: string;
  title: string;
  artist: string | null;
  audio_url: string;
  cover_image: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const ADMIN_TRACK_SELECT =
  "id, title, artist, audio_url, cover_image, sort_order, created_at, updated_at";

function mapAdminTrack(row: AdminTrackRow): Track {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist ?? "",
    audioUrl: row.audio_url,
    coverImage: row.cover_image ?? "",
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllTracksForAdmin(): Promise<Track[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tracks")
    .select(ADMIN_TRACK_SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as AdminTrackRow[]).map(mapAdminTrack);
}
