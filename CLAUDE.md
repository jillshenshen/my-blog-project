# CLAUDE.md

這是個人技術部落格專案的開發指南。每次開始工作前請先完整閱讀此文件。

---

## 專案概述

個人技術部落格，目標是透過高品質技術文章累積讀者群，以 SEO 為核心設計。
功能包含：文章系統、相簿、留言、音樂播放器（自家 MP3）、主題切換、管理後台。

參考規格書：`/docs/blog-spec.md`

---

## 技術棧

| 項目 | 技術 |
|------|------|
| 框架 | Next.js 16（App Router + Turbopack） |
| 語言 | TypeScript（strict mode） |
| 樣式 | Tailwind CSS v4 |
| 資料庫 | Supabase（PostgreSQL） |
| 檔案儲存 | Supabase Storage（`blog-images` bucket） |
| 身份驗證 | Supabase Auth + `@supabase/ssr`（cookie-aware） |
| 文章編輯器 | Tiptap v3 (StarterKit + Image/Link/TaskList/Underline/Color/TextStyle/FontFamily/Highlight/TextAlign/Youtube + 自訂 Figure / Indent / FontSize 節點) |
| 內容渲染 | sanitized HTML（`isomorphic-dompurify`） |
| 部署 | Vercel |
| 音樂播放 | 自家 MP3（HTML5 `<audio>` + Supabase Storage `audio` bucket） |

> **內容格式重點**：`posts.content` 儲存 **HTML**（Tiptap 編輯器輸出，存檔時用 DOMPurify 白名單清洗），不是 Markdown。前台渲染走 `<HtmlContent />` 元件 + `dangerouslySetInnerHTML`。

---

## 專案結構

```
├── app/
│   ├── (blog)/                       # 前台頁面（route group）
│   │   ├── page.tsx                  # 首頁
│   │   ├── posts/                    # 文章列表與詳細頁
│   │   ├── tags/, categories/        # 分類 / 標籤索引與篩選頁
│   │   ├── archive/[year]/[month]/   # 月份歸檔頁
│   │   └── search/                   # 搜尋頁
│   ├── admin/
│   │   ├── login/                    # 登入頁（不受 (authed) 包覆）
│   │   ├── (authed)/                 # 受保護的 admin 殼
│   │   │   ├── layout.tsx            # 含頂部 nav / 登出
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── posts/{,new,[id]/edit}/
│   │   │   ├── categories/, tags/    # 分類 / 標籤管理
│   │   ├── preview/                  # 預覽頁（不繼承 (authed) 殼，但仍受 proxy 鑑權）
│   │   └── actions.ts                # logout server action
│   ├── robots.ts, sitemap.ts
│   └── layout.tsx                    # 根 layout（fonts / theme init）
├── components/
│   ├── admin/                        # 後台專用：PostForm、TiptapEditor、FigureNodeView 等
│   ├── blog/                         # 文章 / 列表 / Sidebar 用元件
│   ├── layout/                       # Header / Footer / Sidebar / SearchBar
│   └── ui/                           # SectionHeading / ThemeToggle
├── lib/
│   ├── supabase/
│   │   ├── server.ts                 # 公開讀取（anon key, no cookies）
│   │   ├── server-auth.ts            # cookie-aware（Server Component / Server Action 用）
│   │   ├── admin.ts                  # service role（bypass RLS, server-only）
│   │   ├── client.ts                 # 瀏覽器端
│   │   ├── middleware.ts             # session refresh + admin route guard
│   │   └── queries/                  # posts.ts / tags.ts / admin-posts.ts
│   ├── utils/                        # slugify / format / reading-time / sanitize-html / decode-param / dedupe-figure-images
│   └── types/                        # post / tag / category
├── proxy.ts                          # Next 16 proxy（即過去的 middleware.ts）
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql
│   │   └── 0002_storage_blog_images.sql
│   └── seed.sql
├── styles/themes/                    # base.css / light.css / dark.css
└── docs/                             # blog-spec / ARCHITECTURE / DATABASE
```

---

## 程式碼規範

### 命名規則
- **元件**：PascalCase（`ArticleCard.tsx`）
- **函式 / 變數**：camelCase（`fetchPosts`）
- **CSS 類別**：使用 Tailwind，不自訂 class name
- **檔案名稱**：kebab-case（`article-card.tsx`），元件除外
- **型別 / 介面**：PascalCase，`type` 優先於 `interface`

### TypeScript
- 嚴格模式（`strict: true`），不允許 `any`
- 所有函式參數與回傳值都要標注型別
- 共用型別統一放在 `lib/types/`

### React / Next.js
- **只用 App Router**，不使用 Pages Router
- Server Component 優先，有互動需求才加 `"use client"`
- 資料獲取用 Server Component 或 Server Action，不在 Client 直接呼叫 Supabase
- 圖片一律使用 `next/image`
- 連結一律使用 `next/link`

### 樣式
- 只用 Tailwind CSS，不寫自訂 CSS（主題 CSS Variables 除外）
- 主題色系透過 CSS Variables 控制，不寫 hardcode 顏色值
- RWD 優先從 mobile 寫起（mobile-first）

### 非同步
- 統一使用 `async/await`，不用 `.then().catch()`
- 錯誤處理用 `try/catch`，不吞掉錯誤

---

## 開發指令

```bash
npm run dev        # 啟動開發伺服器（http://localhost:3000，Turbopack）
npm run build      # 建置生產版本
npm run start      # 啟動生產伺服器
npm run lint       # ESLint 檢查
# typecheck：直接跑 npx tsc --noEmit（package.json 沒有獨立指令）
```

---

## 環境變數

本地開發在 `.env.local`、Vercel 部署在 Settings → Environment Variables 設定（Production / Preview / Development 三個都要勾）：

```
NEXT_PUBLIC_SITE_URL=          # 本機 http://localhost:3000；Vercel 用 production canonical URL
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server-only，僅 lib/supabase/admin.ts 使用，不可洩漏到 client bundle
```

`.env.local.example` 是模板（沒含真值，已 commit）。

---

## 禁止事項

- ❌ 不使用 Pages Router（`/pages` 目錄）
- ❌ 不使用 `any` 型別
- ❌ 不在 Client Component 直接呼叫 Supabase（安全性問題）
- ❌ 不寫 hardcode 顏色值，一律用 CSS Variables 或 Tailwind token
- ❌ 不自行安裝未在規格書或此文件中提到的套件，需先確認
- ❌ 不修改 `components/ui/` 內的基礎元件（設計系統），有需求先討論
- ❌ 不把 `.env.local` 或任何 secret commit 進 git
- ❌ 不跳過 TypeScript 型別檢查（不用 `// @ts-ignore`）

---

## 當前開發階段

**Phase 1 ~ Phase 4 主要功能均已完成並部署到 Vercel；Phase 5（SEO 強化）部分完成。**

### Phase 1（MVP） — ✅ 已完成
- [x] Next.js + TypeScript + Tailwind + Supabase 初始化
- [x] 資料庫 schema（posts / categories / tags / post_tags + RLS + index）
- [x] 首頁文章列表
- [x] 文章詳細頁（Tiptap 輸出的 sanitized HTML）
- [x] 分類 + 標籤系統（每篇一分類、可多標籤）
- [x] 月份歸檔頁（`/archive/[year]/[month]`）
- [x] 簡易搜尋頁（ILIKE，全文搜尋強化排 Phase 2-D）
- [x] 深色 / 淺色主題切換（CSS Variables + localStorage）
- [x] 響應式設計
- [x] SEO：metadata、robots.txt、sitemap.xml
- [x] Vercel 部署

### Phase 2 — ✅ 已完成
- [x] **2-A**：Supabase Auth、`/admin/login`、proxy.ts 路由保護、Dashboard 殼
- [x] **2-B**：文章 CRUD（後來把 Markdown 編輯器升級為 Tiptap WYSIWYG）
- [x] **2-C**：封面圖 / 內文圖片上傳到 Supabase Storage（`blog-images` bucket）
- [x] 分類 / 標籤後台管理頁（`/admin/categories`、`/admin/tags`，rename + delete）
- [x] 文章預覽功能（`/admin/preview?key=...`，localStorage 暫存）
- [x] 編輯器擴充：背景顏色（Highlight）、YouTube 影片嵌入、特殊字元 popup、文字對齊、增/減縮排、圖片圓角切換
- [x] 排程發布：`PostForm` 新增 datetime-local 欄位，前台公開 query 加 `.lte("published_at", now)` 隱藏未到時間的文章
- [x] 全文搜尋（`supabase/migrations/0004_posts_search.sql`：`posts.search_vector` generated tsvector + GIN index + `search_posts(q)` RPC，含 ts_rank 排序與 ILIKE fallback；`lib/supabase/queries/posts.ts` 的 `searchPosts` 改呼叫 RPC）
- [x] 動態 Open Graph 圖（`app/(blog)/posts/[slug]/opengraph-image.tsx`，1200×630，next/og + Google Fonts dynamic subset 載入 Noto Sans TC / Dancing Script，顯示文章標題 + 分類 + site title）
- [x] 上一篇 / 下一篇導航（`app/(blog)/posts/[slug]/page.tsx`，文章 footer 下方 `adjacent.previous` / `adjacent.next`）
- [x] **2-D 已完成**（RSS Feed 評估後不需要，已移除；文章 TOC 暫不做）

### Phase 3 — ✅ 已完成
- [x] **相簿系統**（`/albums`、`/albums/[slug]`、後台 `/admin/albums` CRUD）
  - DB：`supabase/migrations/0005_albums.sql`（`albums` + `album_images` 表 + RLS：未登入只能讀 published 相簿；公開讀 album_images 需 join 過濾）
  - Storage：重用 `blog-images` bucket，照片路徑 `albums/{albumId}/{uuid}.ext`
  - 前台列表：grid 2/3/4/5 cols（mobile→xl），方形封面 + 標題置中、分頁 20 本一頁
  - 前台詳細頁：方形 grid + Client `AlbumLightbox`（← → / Esc / 點背景關閉、caption + 拍攝日期、鎖捲動）
  - 後台：基本資訊 form、多檔上傳、每張可編輯 alt / caption / taken_at、上/下移、設為封面、刪除（含 Storage 同步刪除）
  - 排程發布：`published_at` 機制與文章一致；前台公開查詢過濾未到時間的相簿
- [x] **留言系統**（匿名 + Google 登入並存、自動公開、一層 reply）
  - DB：`supabase/migrations/0006_comments.sql`（基礎 schema）+ `0007_comments_auth.sql`（加 `user_id` / `author_avatar` / `verified`；RLS 拆 anon / authenticated insert，登入者 user_id 必須 = auth.uid()）
  - 前台：文章內頁底部 `Comments` + `CommentForm`（client-side `onAuthStateChange` 訂閱；未登入顯示 Google 登入 + 暱稱/Email 表單；已登入顯示頭像 + 名字 + ✓ Verified + Sign out）；`CommentItem` / Reply 顯示頭像 + verified 徽章
  - OAuth flow：`app/auth/callback/route.ts` 用 PKCE `exchangeCodeForSession`；`lib/supabase/client.ts` 改用 `createBrowserClient` 共享 cookie session
  - 後台 `/admin/comments`：顯示 verified 徽章 + email + 刪除
  - 安全：`ADMIN_EMAILS` 環境變數白名單，啟用 Google OAuth 後 `/admin/*` 只放行清單內 email（middleware 內檢查）
  - 一層 reply 限制：server action `createCommentAction` 驗證 parent.parent_id IS NULL
- [x] **分享文章**：文章內頁 `ShareButtons`（複製連結 / LINE / Facebook，複製成功有 ✓ 提示）
- [ ] 按讚（評估後不做）

### Phase 4 — 進行中
- [x] **About me 後台 + /about 頁面**
  - `site_settings` key/value 加 `about_photo` / `about_short` / `about_long`（無需新 migration，沿用 0003 site_settings 表）
  - 後台 `/admin/about`：頭像上傳 + 移除 checkbox（檔案進 blog-images bucket 的 `about/` 路徑、舊檔自動刪）；側邊欄短介紹 textarea；/about 頁面用 Tiptap 編輯長 bio（內文圖片走既有 post upload-action）
  - 前台 `Sidebar` About me 區塊改用 DB 資料（aboutPhoto 用 next/image 圓形；aboutShort 文案）
  - 新增 `/about` 頁面（在 (blog) 群組，自動帶 Header / Sidebar / Footer），上方頭像 + 標題 + 短介紹，下方 HtmlContent 渲染長 bio
  - AdminShell 加 About 入口
- [x] **音樂播放器**：自訂 UI + 自家 MP3（取代原本 Spotify Embed 方案，因為訪客只能聽 30 秒）
  - DB：`supabase/migrations/0008_tracks.sql`（tracks 表 + 公開讀 RLS；audio Supabase Storage bucket 20MB，accept mpeg/mp4/wav/ogg/webm/m4a）
  - 後台 `/admin/music`：新增（上傳音檔 + 選填封面 + title/artist）、編輯 metadata、上下排序、刪除（同步從 Storage 刪檔）；AdminShell 加 Music 入口
  - 前台 `components/blog/MusicWidget.tsx`：客製 UI（Music heading + 歌名 / 藝人 + 進度條 + 上一首/播放/下一首/愛心，全手繪 SVG icon），HTML5 `<audio>` 控制，自動接下一首
  - 掛在 `components/layout/Sidebar.tsx`（無 tracks 時不渲染），首頁 + 所有 (blog) 路由 sidebar 顯示；相簿頁無 sidebar 故無播放器
- [ ] 主題切換系統（多套預設主題）、主題微調面板

### Phase 5 — 進行中
- [x] **JSON-LD 結構化資料**（WebSite + BlogPosting + Breadcrumb，commit `0735c13`）
- [x] **WCAG AA 對比度調整**（PageSpeed 反饋，commit `abbf815`）
- [x] **圖片優化**：已全面使用 `next/image`，自動 WebP / lazy loading
- [x] **列表頁 skeleton shimmer loading**（`/posts`、`/albums` + 相簿內頁專屬 skeleton）
- [ ] Google Search Console 提交 + sitemap 驗證
- [ ] Lighthouse 進一步效能微調（目標 Performance ≥ 90）

---

## Supabase 資料庫 Schema

完整 schema、RLS、Index、查詢範例請見 **`docs/DATABASE.md`**。

可執行的 migration / seed 檔在 **`supabase/migrations/`** 目錄：
- `0001_init.sql`：posts / categories / tags / post_tags + RLS + index
- `0002_storage_blog_images.sql`：Storage bucket + 公開讀取 policy
- `0003_site_settings.sql`：site_settings key/value 表（About me / Sidebar 文案等）
- `0004_posts_search.sql`：posts.search_vector tsvector + GIN index + `search_posts(q)` RPC
- `0005_albums.sql`：albums + album_images 表 + RLS
- `0006_comments.sql`：留言表（基礎 schema）
- `0007_comments_auth.sql`：留言表加 user_id / author_avatar / verified
- `0008_tracks.sql`：tracks 表 + audio Storage bucket
- `seed.sql`：示範種子資料（已被使用者清掉，新文章透過後台建立）

關鍵點：
- `posts.content` 儲存 **HTML**（不是 Markdown），由 Tiptap 編輯器產生 + DOMPurify 清洗
- `posts.category_id` 為必填外鍵 (`ON DELETE RESTRICT`) — 每篇文章只屬於一個分類
- 公開 RLS：未登入只能讀 `published = true` 的文章，分類 / 標籤皆公開讀取
- 寫入 / 刪除：透過 server action 用 `service_role` key 繞過 RLS（`lib/supabase/admin.ts`）

---

## SEO 規範

- 每個頁面必須有唯一的 `<title>` 與 `<meta name="description">`
- 使用 Next.js `generateMetadata()` 動態產生 metadata
- 文章頁的 `<title>` 格式：`{文章標題} | 部落格名稱`
- 圖片必須有 `alt` 屬性

---

## Git 規範

```
feat: 新增功能
fix: 修復 bug
style: 樣式調整
refactor: 重構
docs: 文件更新
chore: 設定、套件更新
```

範例：`feat: 新增文章詳細頁 Markdown 渲染`

---

## 每次完成工作後請確認

- [ ] `npm run typecheck` 無錯誤
- [ ] `npm run lint` 無錯誤
- [ ] `npm run build` 可成功建置
- [ ] 沒有 hardcode 的顏色值或機密資訊
- [ ] 新頁面有設定正確的 metadata
