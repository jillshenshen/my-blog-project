-- 0005 相簿（Phase 3）
-- 在 Supabase SQL Editor 整段貼上執行
--
-- 結構：
--   albums         相簿主表
--   album_images   相簿照片，每張一列、用 sort_order 控制顯示順序
--
-- 照片實體儲存在既有的 blog-images bucket，檔案路徑為 albums/{slug}/{uuid}.ext
-- albums.cover_image 直接存照片的 public URL（與 posts.cover_image 行為一致）

-- ─────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────

create table if not exists public.albums (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique not null,
  description  text,
  cover_image  text,
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.album_images (
  id         uuid primary key default gen_random_uuid(),
  album_id   uuid not null references public.albums(id) on delete cascade,
  url        text not null,
  alt        text,
  caption    text,
  taken_at   date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- updated_at trigger（沿用 0001 定義好的 function）
-- ─────────────────────────────────────────

drop trigger if exists albums_updated_at on public.albums;
create trigger albums_updated_at
  before update on public.albums
  for each row execute function public.update_updated_at();

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────

create index if not exists albums_slug_idx          on public.albums(slug);
create index if not exists albums_published_idx     on public.albums(published);
create index if not exists albums_published_at_idx  on public.albums(published_at desc);
create index if not exists album_images_album_id_idx on public.album_images(album_id);
create index if not exists album_images_sort_idx     on public.album_images(album_id, sort_order);

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────

alter table public.albums       enable row level security;
alter table public.album_images enable row level security;

drop policy if exists "公開讀取已發布相簿" on public.albums;
create policy "公開讀取已發布相簿"
  on public.albums for select
  using (published = true);

drop policy if exists "公開讀取已發布相簿的照片" on public.album_images;
create policy "公開讀取已發布相簿的照片"
  on public.album_images for select
  using (
    exists (
      select 1 from public.albums a
      where a.id = album_images.album_id
        and a.published = true
    )
  );

-- 寫入 / 刪除：透過 server action 用 service_role key，自動 bypass RLS
