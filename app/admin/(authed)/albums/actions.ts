"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";
import { isAlbumSlugTaken } from "@/lib/supabase/queries/admin-albums";
import { slugify } from "@/lib/utils/slugify";

const BUCKET = "blog-images";

// 相簿照片上傳前壓縮：max 2400px（長邊）、WebP quality 82、自動套用 EXIF 旋轉
// 目的：避免 Next.js /_next/image 處理大檔（>5MB / >6000px）時 Sharp 超時回 500
async function resizeForAlbum(input: Buffer): Promise<Buffer> {
  return sharp(input, { failOn: "none", limitInputPixels: false })
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
}

async function requireAuth() {
  const supabase = await getSupabaseServerWithAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");
  return user;
}

type AlbumFormFields = {
  title: string;
  slug: string;
  description: string | null;
  published: boolean;
  publishedAtIso: string | null;
};

function parseAlbumForm(formData: FormData): AlbumFormFields {
  const title = String(formData.get("title") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  if (!slug) slug = slugify(title);

  const publishedAtRaw = String(formData.get("publishedAtIso") ?? "").trim();
  const publishedAtIso = (() => {
    if (!publishedAtRaw) return null;
    const d = new Date(publishedAtRaw);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  })();

  return {
    title,
    slug,
    description: String(formData.get("description") ?? "").trim() || null,
    published: formData.get("published") === "on",
    publishedAtIso,
  };
}

function validateAlbum(f: AlbumFormFields): string | null {
  if (!f.title) return "標題為必填";
  if (!f.slug) return "Slug 為必填";
  if (!/^[a-z0-9一-鿿぀-ヿ가-힯-]+$/.test(f.slug))
    return "Slug 格式錯誤（只能用英數小寫、中文、連字號）";
  return null;
}

function revalidateAll(slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/admin/albums");
  revalidatePath("/admin");
  revalidatePath("/albums");
  if (slug) revalidatePath(`/albums/${slug}`);
}

// ─────────────────────────────────────────
// CREATE album
// ─────────────────────────────────────────
export async function createAlbumAction(formData: FormData) {
  await requireAuth();

  const fields = parseAlbumForm(formData);
  const error = validateAlbum(fields);
  if (error) {
    redirect(`/admin/albums/new?error=${encodeURIComponent(error)}`);
  }

  if (await isAlbumSlugTaken(fields.slug)) {
    redirect(
      `/admin/albums/new?error=${encodeURIComponent(`Slug "${fields.slug}" 已被使用`)}`,
    );
  }

  const supabase = getSupabaseAdmin();
  const publishedAt = fields.published
    ? (fields.publishedAtIso ?? new Date().toISOString())
    : null;
  const { data, error: insertError } = await supabase
    .from("albums")
    .insert({
      title: fields.title,
      slug: fields.slug,
      description: fields.description,
      published: fields.published,
      published_at: publishedAt,
    })
    .select("id, slug")
    .single();

  if (insertError || !data) {
    redirect(
      `/admin/albums/new?error=${encodeURIComponent(insertError?.message ?? "新增失敗")}`,
    );
  }

  revalidateAll(data.slug);
  redirect(
    `/admin/albums/${data.id}/edit?notice=${encodeURIComponent("相簿已建立，現在可以上傳照片")}`,
  );
}

// ─────────────────────────────────────────
// UPDATE album
// ─────────────────────────────────────────
export async function updateAlbumAction(id: string, formData: FormData) {
  await requireAuth();

  const fields = parseAlbumForm(formData);
  const error = validateAlbum(fields);
  if (error) {
    redirect(`/admin/albums/${id}/edit?error=${encodeURIComponent(error)}`);
  }

  if (await isAlbumSlugTaken(fields.slug, id)) {
    redirect(
      `/admin/albums/${id}/edit?error=${encodeURIComponent(`Slug "${fields.slug}" 已被其他相簿使用`)}`,
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("albums")
    .select("published, published_at, slug")
    .eq("id", id)
    .single();

  const publishedAt = fields.published
    ? (fields.publishedAtIso ??
       existing?.published_at ??
       new Date().toISOString())
    : null;

  const { error: updateError } = await supabase
    .from("albums")
    .update({
      title: fields.title,
      slug: fields.slug,
      description: fields.description,
      published: fields.published,
      published_at: publishedAt,
    })
    .eq("id", id);

  if (updateError) {
    redirect(
      `/admin/albums/${id}/edit?error=${encodeURIComponent(updateError.message)}`,
    );
  }

  if (existing?.slug && existing.slug !== fields.slug) {
    revalidatePath(`/albums/${existing.slug}`);
  }
  revalidateAll(fields.slug);
  redirect(
    `/admin/albums/${id}/edit?notice=${encodeURIComponent("相簿資訊已更新")}`,
  );
}

// ─────────────────────────────────────────
// DELETE album（含 storage 檔案）
// ─────────────────────────────────────────
export async function deleteAlbumAction(id: string) {
  await requireAuth();
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from("albums")
    .select("slug")
    .eq("id", id)
    .single();

  // 先列出該相簿在 Storage 下的所有檔案並刪除
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(`albums/${id}`, { limit: 1000 });
  if (files && files.length > 0) {
    const paths = files.map((f) => `albums/${id}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) {
    redirect(
      `/admin/albums?error=${encodeURIComponent(`刪除失敗：${error.message}`)}`,
    );
  }

  if (existing?.slug) revalidatePath(`/albums/${existing.slug}`);
  revalidateAll();
  redirect(`/admin/albums?notice=${encodeURIComponent("相簿已刪除")}`);
}

// ─────────────────────────────────────────
// TOGGLE PUBLISH
// ─────────────────────────────────────────
export async function toggleAlbumPublishAction(id: string) {
  await requireAuth();
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("albums")
    .select("published, published_at, slug")
    .eq("id", id)
    .single();

  if (!existing) {
    redirect(`/admin/albums?error=${encodeURIComponent("找不到相簿")}`);
  }

  const nextPublished = !existing.published;
  const publishedAt = nextPublished
    ? (existing.published_at ?? new Date().toISOString())
    : existing.published_at;

  const { error } = await supabase
    .from("albums")
    .update({
      published: nextPublished,
      published_at: nextPublished ? publishedAt : null,
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/albums?error=${encodeURIComponent(error.message)}`);
  }
  if (existing.slug) revalidatePath(`/albums/${existing.slug}`);
  revalidateAll();
}

// ─────────────────────────────────────────
// 上傳並新增相片（多檔）
// ─────────────────────────────────────────
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function uploadAlbumImagesAction(
  albumId: string,
  formData: FormData,
) {
  await requireAuth();
  const files = formData.getAll("files").filter(
    (f): f is File => f instanceof File && f.size > 0,
  );

  if (files.length === 0) {
    redirect(
      `/admin/albums/${albumId}/edit?error=${encodeURIComponent("沒有選擇檔案")}`,
    );
  }

  const supabase = getSupabaseAdmin();

  // 取目前最大 sort_order
  const { data: maxRow } = await supabase
    .from("album_images")
    .select("sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  let nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const inserts: {
    album_id: string;
    url: string;
    sort_order: number;
  }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      errors.push(`${file.name}：不支援的格式`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name}：超過 10MB`);
      continue;
    }
    let processed: Buffer;
    try {
      const original = Buffer.from(await file.arrayBuffer());
      processed = await resizeForAlbum(original);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "影像處理失敗";
      errors.push(`${file.name}：${msg}`);
      continue;
    }
    const key = `albums/${albumId}/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(key, processed, {
        contentType: "image/webp",
        upsert: false,
        cacheControl: "31536000",
      });

    if (uploadError) {
      errors.push(`${file.name}：${uploadError.message}`);
      continue;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(key);

    inserts.push({
      album_id: albumId,
      url: publicUrl,
      sort_order: nextOrder++,
    });
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from("album_images").insert(inserts);
    if (error) errors.push(`寫入資料庫失敗：${error.message}`);
  }

  revalidatePath(`/admin/albums/${albumId}/edit`);
  revalidateAll();

  if (errors.length > 0) {
    redirect(
      `/admin/albums/${albumId}/edit?error=${encodeURIComponent(errors.join(" / "))}`,
    );
  }
  redirect(
    `/admin/albums/${albumId}/edit?notice=${encodeURIComponent(`已上傳 ${inserts.length} 張照片`)}`,
  );
}

// ─────────────────────────────────────────
// 批次更新相片 metadata（alt / caption / taken_at）
//
// formData 的命名規則：alt_{imageId}、caption_{imageId}、takenAt_{imageId}
// 只處理 album 下實際存在的 image id，避免外部塞錯亂的 key
// ─────────────────────────────────────────
export async function batchUpdateAlbumImagesAction(
  albumId: string,
  formData: FormData,
) {
  await requireAuth();
  const supabase = getSupabaseAdmin();

  const { data: imgs, error: listError } = await supabase
    .from("album_images")
    .select("id")
    .eq("album_id", albumId);

  if (listError) {
    redirect(
      `/admin/albums/${albumId}/edit?error=${encodeURIComponent(listError.message)}`,
    );
  }

  const imageIds: string[] = (imgs ?? []).map(
    (r: { id: string }) => r.id,
  );

  if (imageIds.length === 0) {
    redirect(`/admin/albums/${albumId}/edit`);
  }

  const results = await Promise.all(
    imageIds.map(async (id) => {
      const alt =
        String(formData.get(`alt_${id}`) ?? "").trim() || null;
      const caption =
        String(formData.get(`caption_${id}`) ?? "").trim() || null;
      const takenAtRaw = String(formData.get(`takenAt_${id}`) ?? "").trim();
      const takenAt = takenAtRaw || null;
      return supabase
        .from("album_images")
        .update({ alt, caption, taken_at: takenAt })
        .eq("id", id);
    }),
  );

  const errors = results
    .map((r, i) => (r.error ? `${imageIds[i]}: ${r.error.message}` : ""))
    .filter(Boolean);

  revalidatePath(`/admin/albums/${albumId}/edit`);
  revalidateAll();

  if (errors.length > 0) {
    redirect(
      `/admin/albums/${albumId}/edit?error=${encodeURIComponent("部分照片更新失敗：" + errors.join("; "))}`,
    );
  }
  redirect(
    `/admin/albums/${albumId}/edit?notice=${encodeURIComponent(`已儲存 ${imageIds.length} 張照片的變更`)}`,
  );
}

// ─────────────────────────────────────────
// 刪除單張相片（含 storage）
// ─────────────────────────────────────────
export async function deleteAlbumImageAction(imageId: string) {
  await requireAuth();
  const supabase = getSupabaseAdmin();

  const { data: img } = await supabase
    .from("album_images")
    .select("id, album_id, url, album:albums!inner(id, cover_image)")
    .eq("id", imageId)
    .single();

  if (!img) {
    redirect(`/admin/albums?error=${encodeURIComponent("找不到照片")}`);
  }
  const row = img as unknown as {
    id: string;
    album_id: string;
    url: string;
    album: { id: string; cover_image: string | null };
  };

  // 試著從 url 推回 storage path
  const marker = `/${BUCKET}/`;
  const idx = row.url.indexOf(marker);
  if (idx >= 0) {
    const path = row.url.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([path]);
  }

  const { error } = await supabase
    .from("album_images")
    .delete()
    .eq("id", imageId);
  if (error) {
    redirect(
      `/admin/albums/${row.album_id}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  // 若刪掉的剛好是封面，清空 cover_image
  if (row.album.cover_image === row.url) {
    await supabase
      .from("albums")
      .update({ cover_image: null })
      .eq("id", row.album_id);
  }

  revalidatePath(`/admin/albums/${row.album_id}/edit`);
  revalidateAll();
  redirect(
    `/admin/albums/${row.album_id}/edit?notice=${encodeURIComponent("照片已刪除")}`,
  );
}

// ─────────────────────────────────────────
// 設為封面
// ─────────────────────────────────────────
export async function setAlbumCoverAction(albumId: string, imageUrl: string) {
  await requireAuth();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("albums")
    .update({ cover_image: imageUrl })
    .eq("id", albumId);

  if (error) {
    redirect(
      `/admin/albums/${albumId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/admin/albums/${albumId}/edit`);
  revalidateAll();
}

// ─────────────────────────────────────────
// 批次刪除相片（含 storage）
//
// formData 命名：delete_{imageId}=on（checkbox 勾選的值）
// 只處理屬於該 album 的 image id，避免外部塞入別本相簿的 id
// ─────────────────────────────────────────
export async function batchDeleteAlbumImagesAction(
  albumId: string,
  formData: FormData,
) {
  await requireAuth();

  const prefix = "delete_";
  const checkedIds: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith(prefix) && value === "on") {
      checkedIds.push(key.slice(prefix.length));
    }
  }

  if (checkedIds.length === 0) {
    redirect(
      `/admin/albums/${albumId}/edit?error=${encodeURIComponent("沒有選取任何照片")}`,
    );
  }

  const supabase = getSupabaseAdmin();

  // 限定該 album 底下的 image id（同時也驗證權限歸屬）
  const { data: imgs, error: listError } = await supabase
    .from("album_images")
    .select("id, url")
    .eq("album_id", albumId)
    .in("id", checkedIds);

  if (listError) {
    redirect(
      `/admin/albums/${albumId}/edit?error=${encodeURIComponent(listError.message)}`,
    );
  }
  const safeImgs = (imgs ?? []) as { id: string; url: string }[];
  if (safeImgs.length === 0) {
    redirect(
      `/admin/albums/${albumId}/edit?error=${encodeURIComponent("找不到要刪除的照片")}`,
    );
  }

  const { data: albumRow } = await supabase
    .from("albums")
    .select("cover_image")
    .eq("id", albumId)
    .single();

  // 收集 storage 路徑
  const marker = `/${BUCKET}/`;
  const paths = safeImgs
    .map((img) => {
      const i = img.url.indexOf(marker);
      return i >= 0 ? img.url.slice(i + marker.length) : null;
    })
    .filter((p): p is string => p !== null);

  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error: deleteError } = await supabase
    .from("album_images")
    .delete()
    .in(
      "id",
      safeImgs.map((i) => i.id),
    );

  if (deleteError) {
    redirect(
      `/admin/albums/${albumId}/edit?error=${encodeURIComponent(deleteError.message)}`,
    );
  }

  // 若封面在被刪清單裡，清空 cover_image
  if (
    albumRow?.cover_image &&
    safeImgs.some((i) => i.url === albumRow.cover_image)
  ) {
    await supabase
      .from("albums")
      .update({ cover_image: null })
      .eq("id", albumId);
  }

  revalidatePath(`/admin/albums/${albumId}/edit`);
  revalidateAll();
  redirect(
    `/admin/albums/${albumId}/edit?notice=${encodeURIComponent(`已刪除 ${safeImgs.length} 張照片`)}`,
  );
}

// ─────────────────────────────────────────
// 一次性重新壓縮整本相簿的照片
//
// 用途：歷史上傳的原檔（相機 JPG，常見 6000×4000、5–15MB）會讓 Next.js
// /_next/image 在 Sharp 處理時超時回 500，導致 thumbnail 顯示不出來。
// 這個 action 會把每張照片從 Storage 下載 → sharp resize → 上傳新檔
// → 更新 album_images.url（必要時同步更新 albums.cover_image）→ 刪除舊檔。
// ─────────────────────────────────────────
export async function reprocessAlbumImagesAction(albumId: string) {
  await requireAuth();
  const supabase = getSupabaseAdmin();

  const { data: imgs, error: listError } = await supabase
    .from("album_images")
    .select("id, url")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: true });

  if (listError) {
    redirect(
      `/admin/albums/${albumId}/edit?error=${encodeURIComponent(listError.message)}`,
    );
  }
  if (!imgs || imgs.length === 0) {
    redirect(
      `/admin/albums/${albumId}/edit?notice=${encodeURIComponent("沒有可處理的照片")}`,
    );
  }

  const { data: albumRow } = await supabase
    .from("albums")
    .select("cover_image")
    .eq("id", albumId)
    .single();
  let coverImage = albumRow?.cover_image ?? null;

  const marker = `/${BUCKET}/`;
  let processed = 0;
  const failures: string[] = [];

  for (const img of imgs as { id: string; url: string }[]) {
    const idx = img.url.indexOf(marker);
    if (idx < 0) {
      failures.push(`${img.id}：無法解析 Storage 路徑`);
      continue;
    }
    const oldPath = img.url.slice(idx + marker.length);

    const { data: blob, error: dlError } = await supabase.storage
      .from(BUCKET)
      .download(oldPath);
    if (dlError || !blob) {
      failures.push(`${img.id}：下載失敗（${dlError?.message ?? "no data"}）`);
      continue;
    }

    let resized: Buffer;
    try {
      const buffer = Buffer.from(await blob.arrayBuffer());
      resized = await resizeForAlbum(buffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "影像處理失敗";
      failures.push(`${img.id}：${msg}`);
      continue;
    }

    const newPath = `albums/${albumId}/${crypto.randomUUID()}.webp`;
    const { error: upError } = await supabase.storage
      .from(BUCKET)
      .upload(newPath, resized, {
        contentType: "image/webp",
        upsert: false,
        cacheControl: "31536000",
      });
    if (upError) {
      failures.push(`${img.id}：上傳失敗（${upError.message}）`);
      continue;
    }
    const {
      data: { publicUrl: newUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(newPath);

    const { error: updateError } = await supabase
      .from("album_images")
      .update({ url: newUrl })
      .eq("id", img.id);
    if (updateError) {
      // 回滾：把新上傳的檔案刪掉，避免孤兒檔
      await supabase.storage.from(BUCKET).remove([newPath]);
      failures.push(`${img.id}：DB 更新失敗（${updateError.message}）`);
      continue;
    }

    if (coverImage === img.url) {
      await supabase
        .from("albums")
        .update({ cover_image: newUrl })
        .eq("id", albumId);
      coverImage = newUrl;
    }

    // 確認新檔已寫入後再刪舊檔；刪失敗只記 warning，不影響整體
    await supabase.storage.from(BUCKET).remove([oldPath]);
    processed++;
  }

  revalidatePath(`/admin/albums/${albumId}/edit`);
  revalidateAll();

  const summary =
    failures.length > 0
      ? `已重新壓縮 ${processed} 張，${failures.length} 張失敗：${failures.join("；")}`
      : `已重新壓縮 ${processed} 張照片`;
  redirect(
    `/admin/albums/${albumId}/edit?${failures.length > 0 ? "error" : "notice"}=${encodeURIComponent(summary)}`,
  );
}

// ─────────────────────────────────────────
// 上 / 下移排序（交換 sort_order）
// ─────────────────────────────────────────
export async function moveAlbumImageAction(
  imageId: string,
  direction: "up" | "down",
) {
  await requireAuth();
  const supabase = getSupabaseAdmin();

  const { data: target } = await supabase
    .from("album_images")
    .select("id, album_id, sort_order")
    .eq("id", imageId)
    .single();
  if (!target) return;

  // up：找 sort_order 比目前小的、由大到小取第一個 → 立刻在上方那張
  // down：找 sort_order 比目前大的、由小到大取第一個 → 立刻在下方那張
  const baseQuery = supabase
    .from("album_images")
    .select("id, sort_order")
    .eq("album_id", target.album_id)
    .order("sort_order", { ascending: direction !== "up" })
    .limit(1);

  const { data: neighbours } =
    direction === "up"
      ? await baseQuery.lt("sort_order", target.sort_order)
      : await baseQuery.gt("sort_order", target.sort_order);

  const neighbour = neighbours?.[0];
  if (!neighbour) return; // 已在最上 / 最下

  await supabase
    .from("album_images")
    .update({ sort_order: neighbour.sort_order })
    .eq("id", target.id);
  await supabase
    .from("album_images")
    .update({ sort_order: target.sort_order })
    .eq("id", neighbour.id);

  revalidatePath(`/admin/albums/${target.album_id}/edit`);
  revalidateAll();
}
