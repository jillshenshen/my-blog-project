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
| 框架 | Next.js 15（App Router） |
| 語言 | TypeScript（strict mode） |
| 樣式 | Tailwind CSS |
| 資料庫 | Supabase（PostgreSQL） |
| 檔案儲存 | Supabase Storage |
| 身份驗證 | Supabase Auth |
| 部署 | Vercel |
| 音樂播放 | Spotify Embed |

---

## 專案結構

```
├── app/                    # Next.js App Router 頁面
│   ├── (blog)/             # 前台頁面（文章、相簿等）
│   │   ├── page.tsx        # 首頁
│   │   ├── posts/          # 文章列表與詳細頁
│   │   ├── albums/         # 相簿
│   │   └── tags/           # 標籤頁
│   ├── admin/              # 管理後台（需驗證）
│   │   ├── posts/          # 文章管理
│   │   ├── albums/         # 相簿管理
│   │   └── settings/       # 主題與播放器設定
│   └── api/                # API Routes
├── components/
│   ├── ui/                 # 基礎 UI 元件（Button、Input 等）
│   ├── blog/               # 文章相關元件
│   ├── album/              # 相簿相關元件
│   ├── player/             # 音樂播放器元件
│   └── layout/             # Header、Footer、Sidebar
├── lib/
│   ├── supabase/           # Supabase client 與查詢
│   ├── utils/              # 工具函式
│   └── types/              # TypeScript 型別定義
├── styles/
│   └── themes/             # CSS Variables 主題定義
├── public/                 # 靜態資源
└── docs/
    └── blog-spec.md        # 產品規格書
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
npm run dev        # 啟動開發伺服器（http://localhost:3000）
npm run build      # 建置生產版本
npm run start      # 啟動生產伺服器
npm run lint       # ESLint 檢查
npm run typecheck  # TypeScript 型別檢查
```

---

## 環境變數

需要在 `.env.local` 設定以下變數（不要把實際值 commit 進 git）：

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

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

**現在是 Phase 1（MVP）**

### Phase 1 範圍（請專注在這裡）
- [ ] 專案初始化（Next.js + TypeScript + Tailwind + Supabase）
- [ ] 資料庫 schema 建立（文章、標籤）
- [ ] 首頁（文章列表）
- [ ] 文章詳細頁（Markdown 渲染 + 語法高亮）
- [ ] 標籤系統
- [ ] 深色 / 淺色主題切換
- [ ] 響應式設計
- [ ] SEO：Meta Tags、robots.txt、基本 Sitemap
- [ ] Vercel 部署設定

### 尚未開始的階段（暫不處理）
- Phase 2：管理後台、搜尋、RSS、Open Graph
- Phase 3：留言、按讚、相簿
- Phase 4：音樂播放器、主題切換系統
- Phase 5：JSON-LD、效能優化

---

## Supabase 資料庫 Schema（Phase 1）

```sql
-- 文章
create table posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text not null,         -- Markdown 原始內容
  excerpt text,                  -- 摘要
  cover_image text,              -- 封面圖 URL
  published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 標籤
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null
);

-- 文章標籤關聯
create table post_tags (
  post_id uuid references posts(id) on delete cascade,
  tag_id  uuid references tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
```

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
