-- 種子資料：跟原 lib/data/mock-posts.ts 一致
-- 在 Supabase SQL Editor 執行 0001_init.sql 後，再執行此檔
-- 重複執行安全（用 ON CONFLICT 處理）

-- ─────────────────────────────────────────
-- Categories
-- ─────────────────────────────────────────
insert into categories (name, slug) values
  ('Lifestyle', 'lifestyle'),
  ('Travel',    'travel'),
  ('Beauty',    'beauty'),
  ('Food',      'food'),
  ('Tech',      'tech')
on conflict (slug) do nothing;

-- ─────────────────────────────────────────
-- Tags
-- ─────────────────────────────────────────
insert into tags (name, slug) values
  ('nextjs',     'nextjs'),
  ('typescript', 'typescript'),
  ('css',        'css'),
  ('supabase',   'supabase'),
  ('design',     'design'),
  ('tutorial',   'tutorial'),
  ('thoughts',   'thoughts'),
  ('review',     'review')
on conflict (slug) do nothing;

-- ─────────────────────────────────────────
-- Posts
-- ─────────────────────────────────────────
insert into posts (title, slug, content, excerpt, cover_image, category_id, published, published_at)
values
  (
    'A Lovely Night',
    'a-lovely-night',
    E'這是一篇用來示範 **Markdown 渲染** 與 *語法高亮* 的文章。\n\n## 為什麼選擇 Next.js\n\n- App Router 原生支援 Server Components\n- 內建 Image / Font 優化\n- Vercel 部署一鍵搞定\n\n## 程式碼範例\n\n```tsx\ntype Props = { title: string };\n\nexport function Hello({ title }: Props) {\n  return <h1>{title}</h1>;\n}\n```\n\n```bash\nnpm run dev\n```\n\n## 清單與表格\n\n| 項目 | 狀態 |\n| --- | --- |\n| 文章列表 | ✅ |\n| Markdown 渲染 | ✅ |\n| 主題切換 | ✅ |\n\n> 引用區塊也支援樣式。',
    '用一篇 Markdown 範例文章驗證標題、程式碼區塊、清單與表格的渲染效果。',
    'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=1200&q=80',
    (select id from categories where slug = 'tech'),
    true,
    '2025-03-04T00:00:00Z'
  ),
  (
    'Someone In The Crowd',
    'someone-in-the-crowd',
    E'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\nSed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
    (select id from categories where slug = 'lifestyle'),
    true,
    '2024-11-12T00:00:00Z'
  ),
  (
    'Right Path Mystery',
    'right-path-mystery',
    'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio.',
    'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra.',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
    (select id from categories where slug = 'travel'),
    true,
    '2024-06-21T00:00:00Z'
  ),
  (
    'My Style Statement',
    'my-style-statement',
    'Aenean nec lorem. In porttitor.',
    'Aenean nec lorem. In porttitor. Donec laoreet nonummy augue. Suspendisse dui purus, scelerisque at, vulputate vitae, pretium mattis.',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80',
    (select id from categories where slug = 'beauty'),
    true,
    '2024-02-15T00:00:00Z'
  ),
  (
    'Ways to Remember',
    'ways-to-remember',
    'Nullam tincidunt adipiscing enim.',
    'Nullam tincidunt adipiscing enim. Phasellus tempus. Proin viverra, ligula sit amet ultrices semper.',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80',
    (select id from categories where slug = 'food'),
    true,
    '2023-09-08T00:00:00Z'
  ),
  (
    'Crafting CSS Variables',
    'crafting-css-variables',
    '本文介紹如何用 CSS Variables 設計可主題化的網站。',
    '用 CSS Custom Properties 建立可主題化的設計系統，讓深淺切換與主題微調更簡單。',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&q=80',
    (select id from categories where slug = 'tech'),
    true,
    '2023-02-20T00:00:00Z'
  )
on conflict (slug) do nothing;

-- ─────────────────────────────────────────
-- Post ↔ Tag 關聯
-- ─────────────────────────────────────────
insert into post_tags (post_id, tag_id)
select p.id, t.id from posts p, tags t
where (p.slug, t.slug) in (
  ('a-lovely-night',         'nextjs'),
  ('a-lovely-night',         'typescript'),
  ('a-lovely-night',         'tutorial'),
  ('someone-in-the-crowd',   'thoughts'),
  ('right-path-mystery',     'thoughts'),
  ('right-path-mystery',     'review'),
  ('my-style-statement',     'design'),
  ('my-style-statement',     'review'),
  ('ways-to-remember',       'thoughts'),
  ('crafting-css-variables', 'css'),
  ('crafting-css-variables', 'design'),
  ('crafting-css-variables', 'tutorial')
)
on conflict do nothing;
