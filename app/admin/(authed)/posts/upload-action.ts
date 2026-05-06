"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";

const BUCKET = "blog-images";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function uploadImageAction(
  formData: FormData,
): Promise<UploadResult> {
  // 驗證登入
  const supabaseAuth = await getSupabaseServerWithAuth();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) return { ok: false, error: "未登入" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "未提供檔案" };

  if (!ALLOWED_MIME.has(file.type)) {
    return {
      ok: false,
      error: `不支援的格式：${file.type}（僅接受 JPEG / PNG / WebP / GIF / AVIF）`,
    };
  }
  if (file.size === 0) return { ok: false, error: "空檔案" };
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `檔案太大（${(file.size / 1024 / 1024).toFixed(1)}MB），上限 10MB`,
    };
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const key = `posts/${crypto.randomUUID()}.${ext}`;

  const supabase = getSupabaseAdmin();
  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: "31536000", // 1 year
    });

  if (error) return { ok: false, error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(key);

  return { ok: true, url: publicUrl };
}
