-- 0003 site_settings：網站全站設定（key / value 表，方便後續擴充）
-- 在 Supabase SQL Editor 整段貼上執行

create table if not exists public.site_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- 公開讀取（前台 Header / Footer 會用 anon key 取出）
drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
  on public.site_settings for select
  to anon, authenticated
  using (true);

-- 寫入只允許 service_role（透過 server action / lib/supabase/admin.ts）
-- 不需要為 service role 寫 policy，service role 自動繞過 RLS

-- 種子值：與 Header / Footer 原本硬編碼一致
insert into public.site_settings (key, value) values
  ('site_title',    'Jill''s blog'),
  ('site_subtitle', 'Higher Place Blog')
on conflict (key) do nothing;
