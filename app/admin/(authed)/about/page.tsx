import type { Metadata } from "next";
import Image from "next/image";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { TiptapEditor } from "@/components/admin/TiptapEditor";
import { updateAboutAction } from "@/app/admin/(authed)/about/actions";

export const metadata: Metadata = {
  title: "About",
  robots: { index: false, follow: false },
};

type AboutData = {
  aboutPhoto: string;
  aboutShort: string;
  aboutLong: string;
};

async function getAbout(): Promise<AboutData> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value");
  if (error) throw error;
  const map = new Map<string, string>();
  for (const row of (data ?? []) as { key: string; value: string }[]) {
    map.set(row.key, row.value);
  }
  return {
    aboutPhoto: map.get("about_photo") ?? "",
    aboutShort: map.get("about_short") ?? "",
    aboutLong: map.get("about_long") ?? "",
  };
}

type SearchParams = { notice?: string; error?: string };

export default async function AdminAboutPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { notice, error } = await searchParams;
  const data = await getAbout();

  return (
    <div>
      <header className="border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          About
        </h1>
        <p className="mt-2 text-sm text-muted">
          編輯側邊欄 About me 區塊與 /about 頁面內容。
        </p>
      </header>

      {notice ? (
        <p className="mt-4 border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 px-4 py-2 text-xs text-accent">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 border border-red-500/40 bg-red-500/5 px-4 py-2 text-xs text-red-500">
          {error}
        </p>
      ) : null}

      <form
        action={updateAboutAction}
        encType="multipart/form-data"
        className="mt-8 space-y-8"
      >
        {/* 頭像 */}
        <section className="space-y-3">
          <h2 className="text-[10px] tracking-[0.3em] text-muted uppercase">
            頭像
          </h2>
          <div className="flex items-center gap-5">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-[var(--color-border)]">
              {data.aboutPhoto ? (
                <Image
                  src={data.aboutPhoto}
                  alt="About me"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] tracking-[0.2em] text-muted uppercase">
                  No
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="text-sm"
              />
              {data.aboutPhoto ? (
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input type="checkbox" name="removePhoto" />
                  移除目前的頭像（提交後生效；若同時選了新檔，會用新檔）
                </label>
              ) : null}
              <span className="text-[11px] text-muted">
                10MB 內；JPEG / PNG / WebP / GIF / AVIF
              </span>
            </div>
          </div>
        </section>

        {/* 短 bio — sidebar 用 */}
        <section>
          <h2 className="text-[10px] tracking-[0.3em] text-muted uppercase">
            側邊欄短介紹
          </h2>
          <textarea
            name="aboutShort"
            rows={3}
            defaultValue={data.aboutShort}
            maxLength={300}
            placeholder="Hi，這裡是…"
            className="mt-2 w-full max-w-2xl border border-[var(--color-border)] bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-muted">
            顯示在前台 Sidebar「About me」區塊。建議 1-2 行。
          </p>
        </section>

        {/* 長 bio — /about 頁用 */}
        <section>
          <h2 className="text-[10px] tracking-[0.3em] text-muted uppercase">
            /about 頁面內容
          </h2>
          <div className="mt-2">
            <TiptapEditor name="aboutLong" defaultValue={data.aboutLong} />
          </div>
        </section>

        <button
          type="submit"
          className="cursor-pointer border border-foreground px-6 py-2 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background"
        >
          儲存
        </button>
      </form>
    </div>
  );
}
