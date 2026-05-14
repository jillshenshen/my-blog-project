import "server-only";
import type { Track } from "@/lib/types/track";
import { getSupabaseServer } from "@/lib/supabase/server";

type TrackRow = {
  id: string;
  title: string;
  artist: string | null;
  audio_url: string;
  cover_image: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const TRACK_SELECT =
  "id, title, artist, audio_url, cover_image, sort_order, created_at, updated_at";

function mapTrack(row: TrackRow): Track {
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

export async function getAllTracks(): Promise<Track[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("tracks")
    .select(TRACK_SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  // migration 還沒跑 → 空陣列，不阻擋 build
  if (error) {
    if (
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      error.code === "42703"
    )
      return [];
    throw error;
  }
  return (data as unknown as TrackRow[]).map(mapTrack);
}
