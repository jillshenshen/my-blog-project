# ARCHITECTURE.md

系統架構文件，說明各模組之間的關係與資料流。
Claude Code 在新增功能或重構時，請確保不破壞此架構。

---

## 整體架構概覽

```
┌─────────────────────────────────────────────────────┐
│                    Vercel（部署）                     │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │              Next.js 15 App                 │   │
│   │                                             │   │
│   │  ┌──────────────┐   ┌──────────────────┐   │   │
│   │  │   前台（Blog） │   │  後台（Admin）    │   │   │
│   │  │  /（首頁）    │   │  /admin/*        │   │   │
│   │  │  /posts/*    │   │  需身份驗證       │   │   │
│   │  │  /albums/*   │   └──────────────────┘   │   │
│   │  │  /tags/*     │                           │   │
│   │  └──────────────┘                           │   │
│   │                                             │   │
│   │  ┌──────────────────────────────────────┐   │   │
│   │  │           Middleware                 │   │   │
│   │  │   驗證 /admin/* 路由的登入狀態        │   │   │
│   │  └──────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────┘   │
│                        │                            │
│                        ▼                            │
│   ┌─────────────────────────────────────────────┐   │
│   │              Supabase                       │   │
│   │                                             │   │
│   │  ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│   │  │PostgreSQL│ │ Storage  │ │    Auth    │  │   │
│   │  │ 文章/標籤 │ │照片/音樂  │ │  管理員    │  │   │
│   │  │ 留言/按讚 │ │          │ │  登入驗證  │  │   │
│   │  └──────────┘ └──────────┘ └────────────┘  │   │
│   └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 資料流

### 前台頁面資料流（SSR）

```
使用者請求頁面
      │
      ▼
Next.js Server Component
      │
      ▼
lib/supabase/server.ts（Server-side Supabase Client）
      │
      ▼
Supabase PostgreSQL
      │
      ▼
資料回傳給 Server Component 渲染 HTML
      │
      ▼
回傳完整 HTML 給使用者（SEO 友善）
```

### 管理後台資料流

```
管理員操作（表單送出）
      │
      ▼
Server Action（app/admin/*/actions.ts）
      │
      ▼
lib/supabase/server.ts（使用 Service Role Key）
      │
      ▼
Supabase PostgreSQL / Storage
      │
      ▼
revalidatePath() 更新快取
      │
      ▼
UI 更新
```

### 身份驗證流

```
任何 /admin/* 請求
      │
      ▼
middleware.ts 攔截
      │
      ├── 未登入 → redirect 到 /admin/login
      │
      └── 已登入 → 放行
```

---

## 模組職責

### `app/` — 頁面與路由

| 路徑 | 職責 |
|------|------|
| `app/(blog)/page.tsx` | 首頁，文章列表 |
| `app/(blog)/posts/[slug]/page.tsx` | 文章詳細頁 |
| `app/(blog)/tags/[slug]/page.tsx` | 標籤頁 |
| `app/(blog)/albums/page.tsx` | 相簿列表 |
| `app/(blog)/albums/[id]/page.tsx` | 相簿詳細頁 |
| `app/admin/page.tsx` | 後台首頁（Dashboard） |
| `app/admin/posts/page.tsx` | 文章管理列表 |
| `app/admin/posts/new/page.tsx` | 新增文章 |
| `app/admin/posts/[id]/edit/page.tsx` | 編輯文章 |
| `app/admin/albums/page.tsx` | 相簿管理 |
| `app/admin/settings/page.tsx` | 主題與播放器設定 |
| `app/admin/login/page.tsx` | 管理員登入頁 |
| `app/api/og/route.ts` | Open Graph 圖片產生 |
| `app/sitemap.ts` | 自動產生 Sitemap |
| `app/robots.ts` | robots.txt |
| `app/feed.xml/route.ts` | RSS Feed |

### `components/` — UI 元件

| 目錄 | 職責 | 說明 |
|------|------|------|
| `components/ui/` | 基礎元件 | Button、Input、Card 等，不應隨意修改 |
| `components/blog/` | 文章相關 | ArticleCard、ArticleList、TOC、CodeBlock |
| `components/album/` | 相簿相關 | AlbumGrid、Lightbox、PhotoCard |
| `components/player/` | 音樂播放器 | SpotifyPlayer |
| `components/layout/` | 版面 | Header、Footer、ThemeToggle、MusicBar |
| `components/admin/` | 後台元件 | MarkdownEditor、ImageUploader |

### `lib/` — 核心邏輯

| 目錄 | 職責 |
|------|------|
| `lib/supabase/client.ts` | Browser-side Supabase client（互動用） |
| `lib/supabase/server.ts` | Server-side Supabase client（資料獲取用） |
| `lib/supabase/queries/` | 所有資料庫查詢函式 |
| `lib/types/` | 全域 TypeScript 型別 |
| `lib/utils/` | 工具函式（日期、slug、閱讀時間等） |
| `lib/theme/` | 主題定義與 CSS Variables |

---

## 重要架構原則

### 1. Server vs Client Component

```
預設 Server Component
      │
      ├── 需要 useState / useEffect / 事件處理
      │   → 加上 "use client"
      │
      └── 只是渲染資料
          → 保持 Server Component（對 SEO 有益）
```

**規則：**
- 資料獲取永遠在 Server Component
- `"use client"` 只用在真正需要互動的葉節點元件
- 不在 Client Component 裡呼叫 Supabase

### 2. Supabase Client 使用規則

```
Server Component / Server Action / Route Handler
→ 使用 lib/supabase/server.ts

Client Component（僅限即時訂閱等特殊需求）
→ 使用 lib/supabase/client.ts
```

### 3. 快取策略

```
靜態內容（文章列表、標籤）
→ Next.js 自動快取，更新時用 revalidatePath()

動態內容（留言、按讚數）
→ 不快取，每次請求重新獲取
```

### 4. 路由保護

```
middleware.ts 負責所有 /admin/* 的驗證
個別 admin 頁面不需要再做驗證邏輯
```

---

## 主題系統架構

```
styles/themes/
├── base.css          ← 所有主題共用的 CSS Variables 定義
├── light.css         ← 淺色主題值
├── dark.css          ← 深色主題值
├── hacker.css        ← 深色駭客主題值
└── warm.css          ← 溫暖橘主題值

運作方式：
<html data-theme="light"> 或 <html data-theme="dark">
CSS Variables 自動套用對應主題
```

---

## 部署架構

```
GitHub Repository
      │
      │  push to main
      ▼
Vercel（自動部署）
      │
      ├── Build：next build
      ├── 環境變數：從 Vercel Dashboard 設定
      └── Domain：vercel.app（免費）或自訂域名
```

**環境變數管理：**
- 本地開發：`.env.local`（不 commit）
- 生產環境：Vercel Dashboard → Environment Variables
