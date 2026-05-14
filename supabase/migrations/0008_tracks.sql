-- 0008 自訂音樂播放器（Phase 4）
-- 在 Supabase SQL Editor 整段貼上執行
--
-- tracks：管理員上傳的 MP3（或其他 audio 格式）+ 封面
-- 公開讀取，寫入透過 service_role
-- 音檔放在新的 `audio` Storage bucket；封面（如有）仍走既有的 blog-images bucket

create table if not exists public.tracks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  artist       text,
  audio_url    text not null,
  cover_image  text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists tracks_updated_at on public.tracks;
create trigger tracks_updated_at
  before update on public.tracks
  for each row execute function public.update_updated_at();

create index if not exists tracks_sort_idx on public.tracks(sort_order);

alter table public.tracks enable row level security;

drop policy if exists "tracks_public_read" on public.tracks;
create policy "tracks_public_read"
  on public.tracks for select
  to anon, authenticated
  using (true);

-- audio bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  true,
  20971520, -- 20 MB
  array['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-m4a']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read for audio" on storage.objects;
create policy "Public read for audio"
  on storage.objects for select
  using (bucket_id = 'audio');
