# DATABASE.md

完整資料庫設計文件。所有 Supabase Schema、RLS 規則、Index 設定都在這裡。
新增 Table 或修改 Schema 前，請先更新此文件。

---

## 資料庫概覽

| Table | 說明 | Phase |
|-------|------|-------|
| `posts` | 文章 | 1 |
| `categories` | 文章分類（每篇一個） | 1 |
| `tags` | 標籤（每篇可多個） | 1 |
| `post_tags` | 文章標籤關聯 | 1 |
| `comments` | 留言 | 3 |
| `likes` | 按讚 | 3 |
| `albums` | 相簿 | 3 |
| `photos` | 照片 | 3 |
| `site_settings` | 網站設定（主題、播放器） | 4 |

> **Categories vs Tags：**
> - Categories：主題分類，每篇文章只屬於 **一個**（透過 `posts.category_id` 外鍵）
> - Tags：自由標籤，每篇文章可有 **多個**（透過 `post_tags` 多對多關聯）

---

## Phase 1 Schema

### `categories` — 分類

```sql
create table categories (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  slug       text unique not null,
  created_at timestamptz default now()
);
```

### `posts` — 文章

```sql
create table posts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique not null,
  content      text not null,          -- sanitized HTML（Tiptap 編輯器輸出 + DOMPurify）
  excerpt      text,                   -- 摘要（手動填寫；空白則前台不顯示）
  cover_image  text,                   -- 封面圖 URL（來自 Supabase Storage `blog-images` bucket）
  category_id  uuid references categories(id) on delete restrict not null,
  published    boolean default false,
  published_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
-- 內容格式說明：
-- 早期規劃為 Markdown，Phase 2-B 改用 Tiptap WYSIWYG 後改為 sanitized HTML。
-- 寫入路徑：app/admin/(authed)/posts/actions.ts → sanitizeContentHtml() → dedupeFigureImages()
-- 讀取路徑：components/blog/HtmlContent.tsx → dangerouslySetInnerHTML

-- 自動更新 updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();
```

### `tags` — 標籤

```sql
create table tags (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  slug       text unique not null,
  created_at timestamptz default now()
);
```

### `post_tags` — 文章標籤關聯

```sql
create table post_tags (
  post_id uuid references posts(id) on delete cascade,
  tag_id  uuid references tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
```

---

## Phase 3 Schema

### `comments` — 留言

```sql
create table comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts(id) on delete cascade not null,
  author     text not null,            -- 留言者名稱
  content    text not null,
  approved   boolean default true,     -- 未來可改為需審核
  created_at timestamptz default now()
);
```

### `likes` — 按讚

```sql
create table likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts(id) on delete cascade not null,
  ip_hash    text not null,            -- 用 hash 過的 IP 防止重複按讚
  created_at timestamptz default now(),
  unique(post_id, ip_hash)             -- 同一 IP 對同一文章只能按一次
);
```

### `albums` — 相簿

```sql
create table albums (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  cover_photo text,                    -- 封面照片 URL
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger albums_updated_at
  before update on albums
  for each row execute function update_updated_at();
```

### `photos` — 照片

```sql
create table photos (
  id         uuid primary key default gen_random_uuid(),
  album_id   uuid references albums(id) on delete cascade not null,
  url        text not null,            -- Supabase Storage URL
  caption    text,
  sort_order int default 0,
  created_at timestamptz default now()
);
```

---

## Phase 4 Schema

### `site_settings` — 網站設定

```sql
create table site_settings (
  id         uuid primary key default gen_random_uuid(),
  key        text unique not null,
  value      text not null,
  updated_at timestamptz default now()
);

-- 初始化預設值
insert into site_settings (key, value) values
  ('theme', 'light'),
  ('primary_color', '#3B82F6'),
  ('font_size', '16'),
  ('border_radius', '8'),
  ('font_family', 'Inter'),
  ('spotify_playlist_url', '');
```

---

## RLS（Row Level Security）規則

### 原則
- 前台讀取：**公開**，任何人都可以讀
- 後台寫入：**僅管理員**（透過 Service Role Key，繞過 RLS）
- 敏感資料（likes 的 ip_hash）：不對外公開

### `posts` RLS

```sql
alter table posts enable row level security;

-- 任何人可以讀取已發布的文章
create policy "公開讀取已發布文章"
  on posts for select
  using (published = true);

-- 只有 Service Role 可以新增/修改/刪除（管理後台使用 Service Role Key）
-- 不需要額外 policy，Service Role 自動繞過 RLS
```

### `categories` RLS

```sql
alter table categories enable row level security;

create policy "公開讀取分類"
  on categories for select
  using (true);
```

### `tags` RLS

```sql
alter table tags enable row level security;

-- 任何人可以讀取標籤
create policy "公開讀取標籤"
  on tags for select
  using (true);
```

### `post_tags` RLS

```sql
alter table post_tags enable row level security;

create policy "公開讀取文章標籤關聯"
  on post_tags for select
  using (true);
```

### `comments` RLS

```sql
alter table comments enable row level security;

-- 任何人可以讀取已審核的留言
create policy "公開讀取留言"
  on comments for select
  using (approved = true);

-- 任何人可以新增留言（匿名留言）
create policy "任何人可以留言"
  on comments for insert
  with check (true);
```

### `likes` RLS

```sql
alter table likes enable row level security;

-- 只能讀取按讚數（不暴露 ip_hash）
create policy "公開讀取按讚"
  on likes for select
  using (true);

-- 任何人可以按讚
create policy "任何人可以按讚"
  on likes for insert
  with check (true);
```

### `albums` / `photos` RLS

```sql
alter table albums enable row level security;
alter table photos enable row level security;

create policy "公開讀取相簿"
  on albums for select using (true);

create policy "公開讀取照片"
  on photos for select using (true);
```

### `site_settings` RLS

```sql
alter table site_settings enable row level security;

-- 任何人可以讀取設定（主題、播放器 URL）
create policy "公開讀取網站設定"
  on site_settings for select
  using (true);

-- 只有 Service Role 可以修改
```

---

## Index 設定

```sql
-- posts：常用查詢欄位
create index posts_slug_idx on posts(slug);
create index posts_published_at_idx on posts(published_at desc);
create index posts_published_idx on posts(published);
create index posts_category_id_idx on posts(category_id);

-- categories
create index categories_slug_idx on categories(slug);

-- tags
create index tags_slug_idx on tags(slug);

-- post_tags：關聯查詢
create index post_tags_post_id_idx on post_tags(post_id);
create index post_tags_tag_id_idx on post_tags(tag_id);

-- comments：文章留言查詢
create index comments_post_id_idx on comments(post_id);

-- likes：按讚數查詢
create index likes_post_id_idx on likes(post_id);

-- photos：相簿照片查詢
create index photos_album_id_idx on photos(album_id);
create index photos_sort_order_idx on photos(album_id, sort_order);
```

---

## 全文搜尋設定

```sql
-- 為文章建立全文搜尋向量（繁體中文 + 英文）
alter table posts
  add column search_vector tsvector
  generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, ''))
  ) stored;

create index posts_search_idx on posts using gin(search_vector);

-- 搜尋查詢範例
-- select * from posts where search_vector @@ plainto_tsquery('simple', '關鍵字');
```

---

## Supabase Storage Bucket

### 已啟用：`blog-images`（Phase 2-C）

```
Bucket 名稱：blog-images
設定：Public（檔案可由公開 URL 直接存取，列表受限）
File size limit：10 MB
Allowed MIME：image/jpeg, image/png, image/webp, image/gif, image/avif

資料夾結構：
blog-images/
└── posts/
    └── {uuid}.{ext}    ← 全部封面圖 + 內文圖片混在這裡，用 UUID 避免衝突
```

實際 SQL 在 `supabase/migrations/0002_storage_blog_images.sql`，可在 Supabase SQL Editor 執行。

上傳路徑：`app/admin/(authed)/posts/upload-action.ts`
- 透過 service_role key 上傳（bypass RLS）
- 公開讀取走「Public read for blog-images」policy

### Phase 3 規劃：`albums` / `music`

```
albums/{album-id}/{photo-id}.webp     ← 相簿照片（Phase 3）
music/{filename}.mp3                   ← 自上傳音樂檔（如有）
```

---

## 常用查詢範例

### 取得文章列表（含分類與標籤）

```typescript
const { data } = await supabase
  .from('posts')
  .select(`
    id, title, slug, excerpt, cover_image, published_at,
    category:categories(id, name, slug),
    post_tags(tags(id, name, slug))
  `)
  .eq('published', true)
  .order('published_at', { ascending: false })
```

### 取得單篇文章

```typescript
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    category:categories(id, name, slug),
    post_tags(tags(id, name, slug))
  `)
  .eq('slug', slug)
  .eq('published', true)
  .single()
```

### 取得分類下的所有文章

```typescript
const { data } = await supabase
  .from('posts')
  .select(`*, category:categories!inner(slug)`)
  .eq('category.slug', categorySlug)
  .eq('published', true)
```

### 取得標籤下的所有文章

```typescript
const { data } = await supabase
  .from('post_tags')
  .select(`posts(*), tags!inner(slug)`)
  .eq('tags.slug', tagSlug)
  .eq('posts.published', true)
```

### 取得文章按讚數

```typescript
const { count } = await supabase
  .from('likes')
  .select('*', { count: 'exact', head: true })
  .eq('post_id', postId)
```
