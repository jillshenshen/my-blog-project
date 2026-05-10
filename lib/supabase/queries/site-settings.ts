import "server-only";
import { cache } from "react";
import { getSupabaseServer } from "@/lib/supabase/server";

export type SiteSettings = {
  title: string;
  subtitle: string;
};

const DEFAULTS: SiteSettings = {
  title: "Jill's blog",
  subtitle: "Higher Place Blog",
};

// React cache：同一個 request 內多個元件呼叫只查一次 DB
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value");

  if (error || !data) return DEFAULTS;

  const map = new Map<string, string>();
  for (const row of data as { key: string; value: string }[]) {
    map.set(row.key, row.value);
  }
  return {
    title: map.get("site_title") ?? DEFAULTS.title,
    subtitle: map.get("site_subtitle") ?? DEFAULTS.subtitle,
  };
});
