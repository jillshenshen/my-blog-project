-- Phase 2 Storage: blog-images bucket
-- 用途：文章內嵌圖片 + 封面圖
-- 在 Supabase SQL Editor 整段貼上執行

-- 建立 bucket（public：檔案可由公開 URL 直接存取，但 list 仍受限）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 公開讀取 policy（任何人可下載已上傳的檔案）
drop policy if exists "Public read for blog-images" on storage.objects;
create policy "Public read for blog-images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

-- 寫入 / 刪除：不需要額外 policy
-- 後台透過 service_role key 上傳，自動 bypass RLS
