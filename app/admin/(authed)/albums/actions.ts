"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";
import { isAlbumSlugTaken } from "@/lib/supabase/queries/admin-albums";
import { slugify } from "@/lib/utils/slugify";

const BUCKET = "blog-images";

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
    const ext =
      file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const key = `albums/${albumId}/${crypto.randomUUID()}.${ext}`;
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(key, buffer, {
        contentType: file.type,
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
