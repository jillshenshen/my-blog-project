# CLAUDE.md

這是個人技術部落格專案的開發指南。每次開始工作前請先完整閱讀此文件。

---

## 專案概述

個人技術部落格，目標是透過高品質技術文章累積讀者群，以 SEO 為核心設計。
功能包含：文章系統、相簿、音樂播放器（Spotify Embed）、主題切換、管理後台。

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
| 音樂播放 | Spotify Embed（Phase 4） |

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

**Phase 1 + Phase 2 主要功能均已完成並部署到 Vercel。**

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

### Phase 2 — 進行中
- [x] **2-A**：Supabase Auth、`/admin/login`、proxy.ts 路由保護、Dashboard 殼
- [x] **2-B**：文章 CRUD（後來把 Markdown 編輯器升級為 Tiptap WYSIWYG）
- [x] **2-C**：封面圖 / 內文圖片上傳到 Supabase Storage（`blog-images` bucket）
- [x] 分類 / 標籤後台管理頁（`/admin/categories`、`/admin/tags`，rename + delete）
- [x] 文章預覽功能（`/admin/preview?key=...`，localStorage 暫存）
- [x] 編輯器擴充：背景顏色（Highlight）、YouTube 影片嵌入、特殊字元 popup、文字對齊、增/減縮排、圖片圓角切換
- [x] 排程發布：`PostForm` 新增 datetime-local 欄位，前台公開 query 加 `.lte("published_at", now)` 隱藏未到時間的文章
- [ ] **2-D**：全文搜尋（tsvector）、RSS Feed、動態 Open Graph 圖

### 尚未開始的階段
- Phase 3：留言、按讚、相簿、燈箱
- Phase 4：音樂播放器、主題切換系統、主題微調面板
- Phase 5：JSON-LD、效能優化、Search Console 提交

---

## Supabase 資料庫 Schema

完整 schema、RLS、Index、查詢範例請見 **`docs/DATABASE.md`**。

可執行的 migration / seed 檔在 **`supabase/migrations/`** 目錄：
- `0001_init.sql`：posts / categories / tags / post_tags + RLS + index
- `0002_storage_blog_images.sql`：Storage bucket + 公開讀取 policy
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
