"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";

const AUDIO_BUCKET = "audio";
const IMAGE_BUCKET = "blog-images";

const AUDIO_MAX_BYTES = 20 * 1024 * 1024;
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const AUDIO_MIME = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/x-m4a",
]);
const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

async function requireAuth() {
  const supabase = await getSupabaseServerWithAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return user;
}

function extOf(mime: string): string {
  const sub = mime.split("/")[1] ?? "bin";
  if (sub === "jpeg") return "jpg";
  if (sub === "x-m4a") return "m4a";
  return sub;
}

function revalidateAll() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/music");
}

// ─────────────────────────────────────────
// CREATE：上傳 audio (+ 選填 cover) + 寫入 tracks
// ─────────────────────────────────────────
export async function createTrackAction(formData: FormData) {
  await requireAuth();

  const title = String(formData.get("title") ?? "").trim();
  const artist = String(formData.get("artist") ?? "").trim() || null;
  const audio = formData.get("audio");
  const cover = formData.get("cover");

  if (!title) {
    redirect(`/admin/music?error=${encodeURIComponent("請輸入歌曲標題")}`);
  }
  if (!(audio instanceof File) || audio.size === 0) {
    redirect(`/admin/music?error=${encodeURIComponent("請選擇音訊檔案")}`);
  }
  if (!AUDIO_MIME.has(audio.type)) {
    redirect(
      `/admin/music?error=${encodeURIComponent(`不支援的音訊格式：${audio.type}`)}`,
    );
  }
  if (audio.size > AUDIO_MAX_BYTES) {
    redirect(
      `/admin/music?error=${encodeURIComponent(
        `音訊太大（${(audio.size / 1024 / 1024).toFixed(1)}MB），上限 20MB`,
      )}`,
    );
  }

  const supabase = getSupabaseAdmin();

  // 上傳 audio
  const audioKey = `tracks/${crypto.randomUUID()}.${extOf(audio.type)}`;
  const audioBuffer = await audio.arrayBuffer();
  const { error: audioErr } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(audioKey, audioBuffer, {
      contentType: audio.type,
      upsert: false,
      cacheControl: "31536000",
    });
  if (audioErr) {
    redirect(
      `/admin/music?error=${encodeURIComponent(`音訊上傳失敗：${audioErr.message}`)}`,
    );
  }
  const audioUrl = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(audioKey)
    .data.publicUrl;

  // 上傳 cover（選填）
  let coverUrl: string | null = null;
  if (cover instanceof File && cover.size > 0) {
    if (!IMAGE_MIME.has(cover.type)) {
      redirect(
        `/admin/music?error=${encodeURIComponent(`不支援的封面格式：${cover.type}`)}`,
      );
    }
    if (cover.size > IMAGE_MAX_BYTES) {
      redirect(
        `/admin/music?error=${encodeURIComponent(`封面太大，上限 10MB`)}`,
      );
    }
    const coverKey = `tracks/covers/${crypto.randomUUID()}.${extOf(cover.type)}`;
    const coverBuffer = await cover.arrayBuffer();
    const { error: coverErr } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(coverKey, coverBuffer, {
        contentType: cover.type,
        upsert: false,
        cacheControl: "31536000",
      });
    if (coverErr) {
      redirect(
        `/admin/music?error=${encodeURIComponent(`封面上傳失敗：${coverErr.message}`)}`,
      );
    }
    coverUrl = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(coverKey).data
      .publicUrl;
  }

  // 取目前最大 sort_order
  const { data: maxRow } = await supabase
    .from("tracks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (maxRow?.sort_order ?? -1) + 1;

  const { error: insertErr } = await supabase.from("tracks").insert({
    title,
    artist,
    audio_url: audioUrl,
    cover_image: coverUrl,
    sort_order: sortOrder,
  });

  if (insertErr) {
    redirect(`/admin/music?error=${encodeURIComponent(insertErr.message)}`);
  }

  revalidateAll();
  redirect(`/admin/music?notice=${encodeURIComponent("歌曲已新增")}`);
}

// ─────────────────────────────────────────
// UPDATE：只改 title / artist（換音檔請刪掉重傳）
// ─────────────────────────────────────────
export async function updateTrackAction(id: string, formData: FormData) {
  await requireAuth();
  const title = String(formData.get("title") ?? "").trim();
  const artist = String(formData.get("artist") ?? "").trim() || null;
  if (!title) {
    redirect(`/admin/music?error=${encodeURIComponent("標題不可為空")}`);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("tracks")
    .update({ title, artist })
    .eq("id", id);
  if (error) {
    redirect(`/admin/music?error=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  redirect(`/admin/music?notice=${encodeURIComponent("已更新")}`);
}

// ─────────────────────────────────────────
// DELETE：含 storage
// ─────────────────────────────────────────
export async function deleteTrackAction(id: string) {
  await requireAuth();
  const supabase = getSupabaseAdmin();

  const { data: track } = await supabase
    .from("tracks")
    .select("audio_url, cover_image")
    .eq("id", id)
    .maybeSingle();

  if (track) {
    const removePath = (url: string, bucket: string) => {
      const marker = `/${bucket}/`;
      const idx = url.indexOf(marker);
      if (idx >= 0) return url.slice(idx + marker.length);
      return null;
    };
    const audioPath = removePath(track.audio_url, AUDIO_BUCKET);
    if (audioPath) {
      await supabase.storage.from(AUDIO_BUCKET).remove([audioPath]);
    }
    if (track.cover_image) {
      const coverPath = removePath(track.cover_image, IMAGE_BUCKET);
      if (coverPath) {
        await supabase.storage.from(IMAGE_BUCKET).remove([coverPath]);
      }
    }
  }

  const { error } = await supabase.from("tracks").delete().eq("id", id);
  if (error) {
    redirect(`/admin/music?error=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  redirect(`/admin/music?notice=${encodeURIComponent("已刪除")}`);
}

// ─────────────────────────────────────────
// 排序：交換相鄰兩首的 sort_order
// ─────────────────────────────────────────
export async function moveTrackAction(id: string, direction: "up" | "down") {
  await requireAuth();
  const supabase = getSupabaseAdmin();

  const { data: target } = await supabase
    .from("tracks")
    .select("id, sort_order")
    .eq("id", id)
    .single();
  if (!target) return;

  const baseQuery = supabase
    .from("tracks")
    .select("id, sort_order")
    .order("sort_order", { ascending: direction !== "up" })
    .limit(1);

  const { data: neighbours } =
    direction === "up"
      ? await baseQuery.lt("sort_order", target.sort_order)
      : await baseQuery.gt("sort_order", target.sort_order);

  const neighbour = neighbours?.[0];
  if (!neighbour) return;

  await supabase
    .from("tracks")
    .update({ sort_order: neighbour.sort_order })
    .eq("id", target.id);
  await supabase
    .from("tracks")
    .update({ sort_order: target.sort_order })
    .eq("id", neighbour.id);

  revalidateAll();
}
