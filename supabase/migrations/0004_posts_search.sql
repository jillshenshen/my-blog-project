-- 0004 posts 全文搜尋
-- 在 Supabase SQL Editor 整段貼上執行
--
-- 設計：
--   * posts.search_vector：tsvector generated column
--     - 'simple' configuration（不做語言特定 stemming，可接受中英混合）
--     - title 權重 A、excerpt 權重 B、content 權重 C
--   * GIN index 加速 @@ 查詢
--   * search_posts(q) RPC：含 published + published_at 過濾，以 ts_rank 排序
--     - 對短查詢 / 無法 tokenize 的字串自動退回 ILIKE，避免「打兩個字什麼都搜不到」的體感

-- ─────────────────────────────────────────
-- 1. search_vector generated column + GIN index
-- ─────────────────────────────────────────

alter table public.posts
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title,   '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'C')
  ) stored;

create index if not exists posts_search_vector_idx
  on public.posts using gin (search_vector);

-- ─────────────────────────────────────────
-- 2. search_posts RPC
-- ─────────────────────────────────────────

create or replace function public.search_posts(q text)
returns setof public.posts
language plpgsql
stable
as $$
declare
  tsq     tsquery := plainto_tsquery('simple', coalesce(q, ''));
  pattern text    := '%' || coalesce(q, '') || '%';
begin
  return query
  select p.*
  from public.posts p
  where p.published = true
    and p.published_at is not null
    and p.published_at <= now()
    and (
      (tsq <> ''::tsquery and p.search_vector @@ tsq)
      or p.title ilike pattern
      or coalesce(p.excerpt, '') ilike pattern
    )
  order by
    case
      when tsq <> ''::tsquery then ts_rank(p.search_vector, tsq)
      else 0
    end desc,
    p.published_at desc;
end;
$$;

grant execute on function public.search_posts(text) to anon, authenticated;
