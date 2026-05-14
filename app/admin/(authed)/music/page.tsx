import type { Metadata } from "next";
import Image from "next/image";
import { getAllTracksForAdmin } from "@/lib/supabase/queries/admin-tracks";
import { DeleteTrackButton } from "@/components/admin/DeleteTrackButton";
import {
  createTrackAction,
  deleteTrackAction,
  moveTrackAction,
  updateTrackAction,
} from "@/app/admin/(authed)/music/actions";

export const metadata: Metadata = {
  title: "Music",
  robots: { index: false, follow: false },
};

type SearchParams = { notice?: string; error?: string };

export default async function AdminMusicPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { notice, error } = await searchParams;
  const tracks = await getAllTracksForAdmin();

  return (
    <div className="space-y-12">
      <header className="border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          Music
        </h1>
        <p className="mt-2 text-sm text-muted">
          管理首頁側邊欄音樂播放器的歌單。上傳合法授權的音檔（MP3 / WAV / OGG / M4A），20MB 內。
        </p>
      </header>

      {notice ? (
        <p className="border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 px-4 py-2 text-xs text-accent">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="border border-red-500/40 bg-red-500/5 px-4 py-2 text-xs text-red-500">
          {error}
        </p>
      ) : null}

      {/* 新增歌曲 */}
      <section>
        <h2 className="text-[11px] tracking-[0.3em] text-muted uppercase">
          新增歌曲
        </h2>
        <form
          action={createTrackAction}
          encType="multipart/form-data"
          className="mt-4 max-w-2xl space-y-4 border border-[var(--color-border)] p-5"
        >
          <label className="block">
            <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
              標題
            </span>
            <input
              name="title"
              type="text"
              required
              maxLength={120}
              className="mt-2 w-full border border-[var(--color-border)] bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
              藝人 / Singer（選填）
            </span>
            <input
              name="artist"
              type="text"
              maxLength={120}
              className="mt-2 w-full border border-[var(--color-border)] bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
              音訊檔（必填，20MB 內）
            </span>
            <input
              name="audio"
              type="file"
              accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm,audio/x-m4a"
              required
              className="mt-2 block text-sm"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
              封面（選填，10MB 內）
            </span>
            <input
              name="cover"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="mt-2 block text-sm"
            />
          </label>
          <button
            type="submit"
            className="cursor-pointer border border-foreground px-6 py-2 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background"
          >
            上傳
          </button>
        </form>
      </section>

      {/* 歌曲列表 */}
      <section>
        <h2 className="text-[11px] tracking-[0.3em] text-muted uppercase">
          歌單（{tracks.length}）
        </h2>

        {tracks.length === 0 ? (
          <p className="mt-6 py-10 text-center text-sm text-muted">
            目前沒有歌曲。
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {tracks.map((t, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === tracks.length - 1;
              return (
                <li
                  key={t.id}
                  className="flex flex-col gap-4 border border-[var(--color-border)] p-4 sm:flex-row"
                >
                  <div className="flex-shrink-0">
                    {t.coverImage ? (
                      <div className="relative h-24 w-24 overflow-hidden bg-[var(--color-border)]">
                        <Image
                          src={t.coverImage}
                          alt={t.title}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center bg-[var(--color-border)] text-[10px] tracking-[0.2em] text-muted uppercase">
                        ♪
                      </div>
                    )}
                  </div>

                  <form
                    action={updateTrackAction.bind(null, t.id)}
                    className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2"
                  >
                    <label className="block">
                      <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
                        標題
                      </span>
                      <input
                        name="title"
                        type="text"
                        defaultValue={t.title}
                        required
                        maxLength={120}
                        className="mt-1 w-full border border-[var(--color-border)] bg-background px-2 py-1.5 text-sm text-foreground focus:border-foreground focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
                        藝人
                      </span>
                      <input
                        name="artist"
                        type="text"
                        defaultValue={t.artist}
                        maxLength={120}
                        className="mt-1 w-full border border-[var(--color-border)] bg-background px-2 py-1.5 text-sm text-foreground focus:border-foreground focus:outline-none"
                      />
                    </label>
                    <div className="sm:col-span-2">
                      <audio
                        controls
                        preload="metadata"
                        src={t.audioUrl}
                        className="w-full"
                      />
                    </div>
                    <button
                      type="submit"
                      className="cursor-pointer self-start border border-foreground px-4 py-1.5 text-[10px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background sm:col-span-2"
                    >
                      儲存
                    </button>
                  </form>

                  <div className="flex flex-shrink-0 flex-col items-end gap-2 sm:w-24">
                    <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase">
                      {!isFirst ? (
                        <form action={moveTrackAction.bind(null, t.id, "up")}>
                          <button
                            type="submit"
                            className="cursor-pointer text-muted transition hover:text-foreground"
                          >
                            ↑
                          </button>
                        </form>
                      ) : null}
                      {!isLast ? (
                        <form action={moveTrackAction.bind(null, t.id, "down")}>
                          <button
                            type="submit"
                            className="cursor-pointer text-muted transition hover:text-foreground"
                          >
                            ↓
                          </button>
                        </form>
                      ) : null}
                    </div>
                    <DeleteTrackButton
                      title={t.title}
                      action={deleteTrackAction.bind(null, t.id)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
