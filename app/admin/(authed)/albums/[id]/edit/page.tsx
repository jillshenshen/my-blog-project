import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumForm } from "@/components/admin/AlbumForm";
import { BatchDeleteAlbumImagesBar } from "@/components/admin/BatchDeleteAlbumImagesBar";
import { DeleteAlbumImageButton } from "@/components/admin/DeleteAlbumImageButton";
import { ReprocessAlbumImagesButton } from "@/components/admin/ReprocessAlbumImagesButton";
import { SubmittingButton } from "@/components/admin/SubmittingButton";
import { getAlbumByIdForAdmin } from "@/lib/supabase/queries/admin-albums";
import {
  batchDeleteAlbumImagesAction,
  batchUpdateAlbumImagesAction,
  deleteAlbumImageAction,
  moveAlbumImageAction,
  reprocessAlbumImagesAction,
  setAlbumCoverAction,
  updateAlbumAction,
  uploadAlbumImagesAction,
} from "@/app/admin/(authed)/albums/actions";

export const metadata: Metadata = {
  title: "Edit Album",
  robots: { index: false, follow: false },
};

const BATCH_FORM_ID = "batch-edit-images";
const BATCH_DELETE_FORM_ID = "batch-delete-images";

type Params = { id: string };
type SearchParams = { error?: string; notice?: string };

export default async function EditAlbumPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { error, notice } = await searchParams;

  const album = await getAlbumByIdForAdmin(id);
  if (!album) notFound();

  return (
    <div className="space-y-12">
      <header className="border-b border-[var(--color-border)] pb-6">
        <p className="text-[10px] tracking-[0.3em] text-muted uppercase">
          <Link href="/admin/albums" className="hover:text-foreground">
            ← Albums
          </Link>
        </p>
        <h1 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
          編輯：{album.title}
        </h1>
      </header>

      {/* 基本資訊 */}
      <section>
        <h2 className="text-[11px] tracking-[0.3em] text-muted uppercase">
          基本資訊
        </h2>
        <div className="mt-4 max-w-3xl">
          <AlbumForm
            mode="edit"
            initial={album}
            action={updateAlbumAction.bind(null, album.id)}
            errorMessage={error}
            noticeMessage={notice}
          />
        </div>
      </section>

      {/* 上傳照片 */}
      <section>
        <h2 className="text-[11px] tracking-[0.3em] text-muted uppercase">
          上傳照片
        </h2>
        <form
          action={uploadAlbumImagesAction.bind(null, album.id)}
          encType="multipart/form-data"
          className="mt-4 flex flex-col gap-3 border border-[var(--color-border)] p-4 sm:flex-row sm:items-center"
        >
          <input
            type="file"
            name="files"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            required
            className="text-sm text-foreground"
          />
          <SubmittingButton
            pendingText="上傳中…"
            className="cursor-pointer self-start border border-foreground px-5 py-2 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background sm:self-auto"
          >
            上傳
          </SubmittingButton>
          <span className="text-[11px] text-muted">
            可一次選多張；單檔 10MB 內，JPEG / PNG / WebP / GIF / AVIF。上傳後會自動壓成 max 2400px WebP。
          </span>
        </form>
      </section>

      {album.images.length > 0 ? (
        <section>
          <h2 className="text-[11px] tracking-[0.3em] text-muted uppercase">
            維護
          </h2>
          <div className="mt-4 flex flex-col gap-3 border border-[var(--color-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-foreground">
                重新壓縮所有照片
              </p>
              <p className="text-[11px] text-muted">
                把舊上傳的原檔（過大圖會導致 Next.js image optimizer 超時）重新處理成 max 2400px WebP。
              </p>
            </div>
            <ReprocessAlbumImagesButton
              action={reprocessAlbumImagesAction.bind(null, album.id)}
              count={album.images.length}
            />
          </div>
        </section>
      ) : null}

      {/* 照片管理 — 批次儲存 */}
      <section>
        <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-3">
          <h2 className="text-[11px] tracking-[0.3em] text-muted uppercase">
            相片（{album.images.length}）
          </h2>
          {album.images.length > 0 ? (
            <p className="text-[11px] text-muted">
              編輯任一張照片資訊後，點頁面最下方的「儲存變更」批次寫入
            </p>
          ) : null}
        </div>

        {/* 批次表單：以下每張照片的 input 透過 form="..." 屬性掛上來；
            submit button 必須是 form 的子節點，useFormStatus 才能偵測 pending */}

        {album.images.length === 0 ? (
          <p className="mt-6 py-10 text-center text-sm text-muted">
            這本相簿還沒有照片，請從上方上傳。
          </p>
        ) : (
          <>
            <form
              id={BATCH_DELETE_FORM_ID}
              action={batchDeleteAlbumImagesAction.bind(null, album.id)}
            >
              <BatchDeleteAlbumImagesBar />
            </form>
            <ul className="mt-4 space-y-4">
              {album.images.map((img, idx) => {
                const isCover = album.coverImage === img.url;
                const isFirst = idx === 0;
                const isLast = idx === album.images.length - 1;
                return (
                  <li
                    key={img.id}
                    className="flex flex-col gap-4 border border-[var(--color-border)] p-4 sm:flex-row"
                  >
                    <div className="flex-shrink-0">
                      <div className="relative h-32 w-32 overflow-hidden bg-[var(--color-border)]">
                        <Image
                          src={img.url}
                          alt={img.alt || "album image"}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </div>
                      {isCover ? (
                        <p className="mt-2 text-center text-[10px] tracking-[0.2em] text-accent uppercase">
                          Cover
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col gap-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
                            Alt（SEO 替代文字）
                          </span>
                          <input
                            form={BATCH_FORM_ID}
                            name={`alt_${img.id}`}
                            type="text"
                            defaultValue={img.alt}
                            maxLength={200}
                            className="mt-1 w-full border border-[var(--color-border)] bg-background px-2 py-1.5 text-sm text-foreground focus:border-foreground focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
                            拍攝日期
                          </span>
                          <input
                            form={BATCH_FORM_ID}
                            name={`takenAt_${img.id}`}
                            type="date"
                            defaultValue={img.takenAt ?? ""}
                            className="mt-1 w-full border border-[var(--color-border)] bg-background px-2 py-1.5 text-sm text-foreground focus:border-foreground focus:outline-none"
                          />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
                            Caption（燈箱底部說明）
                          </span>
                          <input
                            form={BATCH_FORM_ID}
                            name={`caption_${img.id}`}
                            type="text"
                            defaultValue={img.caption}
                            maxLength={300}
                            className="mt-1 w-full border border-[var(--color-border)] bg-background px-2 py-1.5 text-sm text-foreground focus:border-foreground focus:outline-none"
                          />
                        </label>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase">
                        {!isFirst ? (
                          <form
                            action={moveAlbumImageAction.bind(
                              null,
                              img.id,
                              "up",
                            )}
                          >
                            <button
                              type="submit"
                              className="cursor-pointer text-muted transition hover:text-foreground"
                            >
                              ↑ Up
                            </button>
                          </form>
                        ) : null}
                        {!isLast ? (
                          <form
                            action={moveAlbumImageAction.bind(
                              null,
                              img.id,
                              "down",
                            )}
                          >
                            <button
                              type="submit"
                              className="cursor-pointer text-muted transition hover:text-foreground"
                            >
                              ↓ Down
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 flex-col items-end gap-2 sm:w-32">
                      <label className="flex cursor-pointer items-center gap-2 text-[10px] tracking-[0.2em] text-muted uppercase select-none">
                        <input
                          type="checkbox"
                          name={`delete_${img.id}`}
                          form={BATCH_DELETE_FORM_ID}
                          className="h-4 w-4 cursor-pointer accent-red-500"
                        />
                        <span>選取</span>
                      </label>
                      <form
                        action={setAlbumCoverAction.bind(
                          null,
                          album.id,
                          img.url,
                        )}
                      >
                        <button
                          type="submit"
                          disabled={isCover}
                          className="cursor-pointer text-[10px] tracking-[0.2em] text-foreground uppercase transition hover:text-accent disabled:cursor-default disabled:text-muted"
                        >
                          {isCover ? "✓ Cover" : "Set as Cover"}
                        </button>
                      </form>
                      <DeleteAlbumImageButton
                        action={deleteAlbumImageAction.bind(null, img.id)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* 批次儲存表單 — 頁面最下方；以下 alt / caption / taken_at 透過 form={BATCH_FORM_ID} 掛上 */}
            <form
              id={BATCH_FORM_ID}
              action={batchUpdateAlbumImagesAction.bind(null, album.id)}
              className="mt-8 flex flex-col gap-2 border-t border-[var(--color-border)] pt-6"
            >
              <SubmittingButton
                pendingText="儲存中…"
                className="cursor-pointer self-start border border-foreground px-6 py-2 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background"
              >
                儲存變更
              </SubmittingButton>
              <p className="text-[11px] text-muted">
                注意：點「Set as Cover / ↑↓ / Delete」會立即執行並重整頁面，未儲存的 Alt / Caption / 拍攝日期會回到上次儲存的值。
              </p>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
