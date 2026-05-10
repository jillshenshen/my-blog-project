import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { updateSiteSettingsAction } from "@/app/admin/(authed)/settings/actions";

export const metadata: Metadata = {
  title: "Site Settings",
  robots: { index: false, follow: false },
};

type Settings = { title: string; subtitle: string };

async function getSettings(): Promise<Settings> {
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
    title: map.get("site_title") ?? "",
    subtitle: map.get("site_subtitle") ?? "",
  };
}

type SearchParams = { notice?: string; error?: string };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { notice, error } = await searchParams;
  const settings = await getSettings();

  return (
    <div>
      <header className="border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          Site Settings
        </h1>
        <p className="mt-2 text-sm text-muted">
          編輯網站主標題與副標題，會同步更新前台 Header / Footer 與後台導覽列。
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
        action={updateSiteSettingsAction}
        className="mt-6 max-w-2xl space-y-5 border border-[var(--color-border)] p-6"
      >
        <label className="block">
          <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
            主標題
          </span>
          <input
            name="title"
            type="text"
            defaultValue={settings.title}
            required
            maxLength={80}
            className="mt-2 w-full border border-[var(--color-border)] bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
          />
          <span className="mt-1 block text-[11px] text-muted">
            顯示在前台 Header 的手寫體大標題與 Footer。
          </span>
        </label>

        <label className="block">
          <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
            副標題
          </span>
          <input
            name="subtitle"
            type="text"
            defaultValue={settings.subtitle}
            required
            maxLength={120}
            className="mt-2 w-full border border-[var(--color-border)] bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
          />
          <span className="mt-1 block text-[11px] text-muted">
            顯示在前台 Header 標題下方的小字。
          </span>
        </label>

        <button
          type="submit"
          className="cursor-pointer border border-foreground px-5 py-2 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background"
        >
          儲存
        </button>
      </form>
    </div>
  );
}
