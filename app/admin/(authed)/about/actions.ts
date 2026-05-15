"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";
import { sanitizeContentHtml } from "@/lib/utils/sanitize-html";
import { dedupeFigureImages } from "@/lib/utils/dedupe-figure-images";

const BUCKET = "blog-images";
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
const PHOTO_MIME = new Set([
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

function pathFromUrl(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : null;
}

export async function updateAboutAction(formData: FormData) {
  await requireAuth();

  const aboutShort = String(formData.get("aboutShort") ?? "").trim();
  const aboutLongRaw = String(formData.get("aboutLong") ?? "");
  const aboutLong = dedupeFigureImages(sanitizeContentHtml(aboutLongRaw));
  const photo = formData.get("photo");
  const removePhoto = formData.get("removePhoto") === "on";

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("site_settings")
    .select("key, value")
    .eq("key", "about_photo")
    .maybeSingle();
  const oldPhoto = (existing?.value as string | undefined) ?? "";

  let aboutPhoto = oldPhoto;

  if (removePhoto) {
    aboutPhoto = "";
    if (oldPhoto) {
      const path = pathFromUrl(oldPhoto);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
  } else if (photo instanceof File && photo.size > 0) {
    if (!PHOTO_MIME.has(photo.type)) {
      redirect(
        `/admin/about?error=${encodeURIComponent(`不支援的圖片格式：${photo.type}`)}`,
      );
    }
    if (photo.size > PHOTO_MAX_BYTES) {
      redirect(`/admin/about?error=${encodeURIComponent("照片太大，上限 10MB")}`);
    }
    const ext =
      photo.type.split("/")[1] === "jpeg" ? "jpg" : photo.type.split("/")[1];
    const key = `about/${crypto.randomUUID()}.${ext}`;
    const buffer = await photo.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(key, buffer, {
        contentType: photo.type,
        upsert: false,
        cacheControl: "31536000",
      });
    if (uploadErr) {
      redirect(`/admin/about?error=${encodeURIComponent(uploadErr.message)}`);
    }
    aboutPhoto = supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;

    // 換新照片 → 刪舊
    if (oldPhoto) {
      const path = pathFromUrl(oldPhoto);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("site_settings").upsert(
    [
      { key: "about_photo", value: aboutPhoto, updated_at: now },
      { key: "about_short", value: aboutShort, updated_at: now },
      { key: "about_long", value: aboutLong, updated_at: now },
    ],
    { onConflict: "key" },
  );

  if (error) {
    redirect(`/admin/about?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/about");
  redirect(`/admin/about?notice=${encodeURIComponent("已更新")}`);
}
