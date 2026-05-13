-- 0007 留言 + Google 登入（驗證身分欄位）
-- 在 Supabase SQL Editor 整段貼上執行
--
-- 設計：保留現有匿名留言（user_id IS NULL）；登入後留言則：
--   * user_id = auth.uid()
--   * verified = true
--   * author_avatar = Google profile photo URL
-- 顯示時，verified=true 在前台會帶頭像 + 已驗證標記。

alter table public.comments
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists author_avatar text,
  add column if not exists verified boolean not null default false;

create index if not exists comments_user_id_idx on public.comments(user_id);

-- ─────────────────────────────────────────
-- RLS：擴充原本的 anon INSERT，允許 authenticated 也能寫入；
-- 登入者必須附帶 user_id = auth.uid()（否則別人可以冒充）
-- ─────────────────────────────────────────

drop policy if exists "comments_anon_insert" on public.comments;

create policy "comments_anon_insert_anonymous"
  on public.comments for insert
  to anon
  with check (
    user_id is null
    and verified = false
    and exists (
      select 1 from public.posts p
      where p.id = comments.post_id
        and p.published = true
        and p.published_at is not null
        and p.published_at <= now()
    )
  );

create policy "comments_authenticated_insert"
  on public.comments for insert
  to authenticated
  with check (
    -- 允許「登入者匿名留言」（user_id null）或「登入者驗證留言」（必須 = auth.uid()）
    (user_id is null or user_id = auth.uid())
    and exists (
      select 1 from public.posts p
      where p.id = comments.post_id
        and p.published = true
        and p.published_at is not null
        and p.published_at <= now()
    )
  );
