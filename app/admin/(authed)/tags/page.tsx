import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { TagAdminRow } from "@/components/admin/TagAdminRow";
import {
  deleteTagAction,
  renameTagAction,
} from "@/app/admin/(authed)/tags/actions";

export const metadata: Metadata = {
  title: "Tags",
  robots: { index: false, follow: false },
};

type TagWithCount = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

async function getTagsWithCount(): Promise<TagWithCount[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug, post_tags(count)")
    .order("name", { ascending: true });
  if (error) throw error;
  type Row = {
    id: string;
    name: string;
    slug: string;
    post_tags: { count: number }[];
  };
  return (data as Row[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    postCount: row.post_tags?.[0]?.count ?? 0,
  }));
}

type SearchParams = { notice?: string; error?: string };

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { notice, error } = await searchParams;
  const tags = await getTagsWithCount();

  return (
    <div>
      <header className="border-b border-[var(--color-border)] pb-6">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          Tags
        </h1>
        <p className="mt-2 text-sm text-muted">
          管理所有標籤。新標籤在新增/編輯文章時即時建立即可。
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

      {tags.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted">
          目前沒有標籤。
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--color-border)]">
          {tags.map((tag) => (
            <TagAdminRow
              key={tag.id}
              id={tag.id}
              name={tag.name}
              slug={tag.slug}
              postCount={tag.postCount}
              renameAction={renameTagAction.bind(null, tag.id)}
              deleteAction={deleteTagAction.bind(null, tag.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
