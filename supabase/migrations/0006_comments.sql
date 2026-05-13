-- 0006 留言（Phase 3）
-- 在 Supabase SQL Editor 整段貼上執行
--
-- 設計重點：
--   * 匿名留言：author_name + author_email（email 私密、不在前台公開查詢中選取）
--   * 自動公開（不需審核），刪除走 service_role
--   * 一層 reply：parent_id 指向 root 留言；server action 會驗證 parent.parent_id IS NULL，避免巢狀超過一層
--
-- email 隱私：
--   公開 RLS 允許讀取 comments 整列，但前台 query (lib/supabase/queries/comments.ts) 只選
--   id / post_id / parent_id / author_name / content / created_at 六欄，email 永遠不會送到 client。
--   後台才會用 service_role 讀 email。

create table if not exists public.comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  parent_id    uuid references public.comments(id) on delete cascade,
  author_name  text not null,
  author_email text not null,
  content      text not null,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────

create index if not exists comments_post_id_idx     on public.comments(post_id);
create index if not exists comments_parent_id_idx   on public.comments(parent_id);
create index if not exists comments_created_at_idx  on public.comments(created_at desc);

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────

alter table public.comments enable row level security;

drop policy if exists "comments_public_read" on public.comments;
create policy "comments_public_read"
  on public.comments for select
  to anon, authenticated
  using (true);

-- anon 可以新增留言；但限制只能對「已發布且 published_at <= now()」的文章留言，避免被丟進草稿
drop policy if exists "comments_anon_insert" on public.comments;
create policy "comments_anon_insert"
  on public.comments for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = comments.post_id
        and p.published = true
        and p.published_at is not null
        and p.published_at <= now()
    )
  );

-- 寫入額外驗證（parent 限一層）放在 server action，不在 RLS 處理
-- 刪除：透過 service_role，不需 policy
