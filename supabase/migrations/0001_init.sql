-- Phase 1 initial schema
-- 在 Supabase SQL Editor 整段貼上執行
-- 來源：docs/DATABASE.md（保持同步）

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────

create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  slug       text unique not null,
  created_at timestamptz default now()
);

create table if not exists posts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique not null,
  content      text not null,
  excerpt      text,
  cover_image  text,
  category_id  uuid references categories(id) on delete restrict not null,
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists tags (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  slug       text unique not null,
  created_at timestamptz default now()
);

create table if not exists post_tags (
  post_id uuid references posts(id) on delete cascade,
  tag_id  uuid references tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ─────────────────────────────────────────
-- Updated_at trigger
-- ─────────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_updated_at on posts;
create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────

create index if not exists posts_slug_idx on posts(slug);
create index if not exists posts_published_at_idx on posts(published_at desc);
create index if not exists posts_published_idx on posts(published);
create index if not exists posts_category_id_idx on posts(category_id);
create index if not exists categories_slug_idx on categories(slug);
create index if not exists tags_slug_idx on tags(slug);
create index if not exists post_tags_post_id_idx on post_tags(post_id);
create index if not exists post_tags_tag_id_idx on post_tags(tag_id);

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────

alter table posts enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table post_tags enable row level security;

drop policy if exists "公開讀取已發布文章" on posts;
create policy "公開讀取已發布文章"
  on posts for select
  using (published = true);

drop policy if exists "公開讀取分類" on categories;
create policy "公開讀取分類"
  on categories for select
  using (true);

drop policy if exists "公開讀取標籤" on tags;
create policy "公開讀取標籤"
  on tags for select
  using (true);

drop policy if exists "公開讀取文章標籤關聯" on post_tags;
create policy "公開讀取文章標籤關聯"
  on post_tags for select
  using (true);
