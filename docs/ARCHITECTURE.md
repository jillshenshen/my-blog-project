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

#### 前台 `app/(blog)/`
| 路徑 | 職責 | 狀態 |
|------|------|------|
| `page.tsx` | 首頁，文章列表 | ✅ |
| `posts/page.tsx` | 全部文章列表 | ✅ |
| `posts/[slug]/page.tsx` | 文章詳細頁 | ✅ |
| `categories/page.tsx` + `[slug]/page.tsx` | 分類索引 + 篩選 | ✅ |
| `tags/page.tsx` + `[slug]/page.tsx` | 標籤索引 + 篩選 | ✅ |
| `archive/[year]/[month]/page.tsx` | 月份歸檔 | ✅ |
| `search/page.tsx` | 搜尋結果（ILIKE，Phase 1 簡易版） | ✅ |
| `albums/page.tsx`、`albums/[id]/page.tsx` | 相簿（Phase 3） | ⏳ |

#### 後台 `app/admin/`
| 路徑 | 職責 | 狀態 |
|------|------|------|
| `login/page.tsx` + `login/actions.ts` | 登入頁 + Server Action | ✅ |
| `(authed)/layout.tsx` | 後台殼（含 nav / 登出 / theme toggle） | ✅ |
| `(authed)/page.tsx` | Dashboard 統計 | ✅ |
| `(authed)/posts/page.tsx` | 文章列表 / 篩選 / publish toggle / delete | ✅ |
| `(authed)/posts/new/page.tsx` | 新增文章 | ✅ |
| `(authed)/posts/[id]/edit/page.tsx` | 編輯文章 | ✅ |
| `(authed)/posts/actions.ts` | create / update / delete / togglePublish / createTag | ✅ |
| `(authed)/posts/upload-action.ts` | 圖片上傳到 Storage | ✅ |
| `(authed)/categories/page.tsx` + `actions.ts` | 分類管理 | ✅ |
| `(authed)/tags/page.tsx` + `actions.ts` | 標籤管理 | ✅ |
| `preview/page.tsx` + `PreviewClient.tsx` | 文章預覽（不繼承 (authed) 殼，但仍受 proxy 鑑權） | ✅ |
| `actions.ts` (root) | logout server action | ✅ |
| `albums/`、`settings/` | Phase 3 / Phase 4 | ⏳ |

#### 其他
| 路徑 | 職責 | 狀態 |
|------|------|------|
| `app/sitemap.ts` | 自動產生 Sitemap（含分類 / 標籤 / 月份） | ✅ |
| `app/robots.ts` | robots.txt | ✅ |
| `app/layout.tsx` | 根 layout（fonts、theme init script、metadata） | ✅ |
| `app/(blog)/posts/[slug]/opengraph-image.tsx` | 動態 OG 圖（next/og + Google Fonts subset） | ✅ |
| `proxy.ts` (root) | Next 16 proxy（前身：middleware.ts），保護 /admin/* 路由 | ✅ |

### `components/` — UI 元件

| 目錄 | 職責 | 主要檔案 |
|------|------|---------|
| `components/ui/` | 基礎共用元件 | `SectionHeading.tsx`、`ThemeToggle.tsx` |
| `components/blog/` | 前台文章相關 | `ArticleCard.tsx`、`PostArticle.tsx`、`HtmlContent.tsx`、`BlogArchive.tsx`、`RecentPosts.tsx`、`TaxonomyList.tsx` |
| `components/layout/` | 版面 | `Header.tsx`、`Footer.tsx`、`Sidebar.tsx`、`SearchBar.tsx` |
| `components/admin/` | 後台 | `PostForm.tsx`、`TiptapEditor.tsx`、`FigureExtension.ts`、`FigureNodeView.tsx`、`IndentExtension.ts`、`TagsField.tsx`、`CoverImageField.tsx`、`DeletePostButton.tsx`、`TagAdminRow.tsx`、`CategoryAdminRow.tsx` |
| `components/album/`、`components/player/` | Phase 3 / Phase 4 | ⏳ |

### `lib/` — 核心邏輯

| 路徑 | 職責 |
|------|------|
| `lib/supabase/server.ts` | 公開讀取 client（anon key, no cookies）— 前台文章、分類、標籤查詢 |
| `lib/supabase/server-auth.ts` | cookie-aware client（`@supabase/ssr`）— login/logout、讀 user session |
| `lib/supabase/admin.ts` | service role client（bypass RLS, server-only）— 後台寫入、Storage 上傳 |
| `lib/supabase/client.ts` | 瀏覽器端 client（Phase 2 起暫無使用，預留 realtime 用） |
| `lib/supabase/middleware.ts` | proxy session refresh + admin route guard |
| `lib/supabase/queries/posts.ts` | 公開文章查詢（getAllPosts / getPostBySlug / 等）— 一律加 `.eq("published", true).lte("published_at", now)`，排程未到時間的文章不會出現在前台 |
| `lib/supabase/queries/tags.ts` | 公開分類 + 標籤查詢 |
| `lib/supabase/queries/admin-posts.ts` | 後台文章查詢（含草稿，用 admin client） |
| `lib/types/` | post.ts / tag.ts / category.ts |
| `lib/utils/format.ts` | 日期格式 |
| `lib/utils/slugify.ts` | 標題 → slug，支援中英文 |
| `lib/utils/reading-time.ts` | 閱讀時間估算（中英混合，先 strip HTML） |
| `lib/utils/decode-param.ts` | Next 16 Turbopack non-ASCII params 解碼防呆 |
| `lib/utils/sanitize-html.ts` | DOMPurify 白名單清洗（server-only） |
| `lib/utils/dedupe-figure-images.ts` | 移除 figure 內 img 同 src 的孤立 raw img |

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
公開讀取（前台文章、分類、標籤）
→ lib/supabase/server.ts (anon key + RLS, no cookies)

需要讀 user session（login/logout、admin layout 確認登入）
→ lib/supabase/server-auth.ts (@supabase/ssr, cookie-aware)

後台寫入（新增/編輯/刪除文章、上傳圖片、tag CRUD、category CRUD）
→ lib/supabase/admin.ts (service_role key, bypass RLS, server-only)

Client Component（暫無使用，預留 realtime 訂閱用）
→ lib/supabase/client.ts
```

> ⚠️ `lib/supabase/admin.ts` 透過 `import 'server-only'` 強制只在 server runtime 載入；service_role key 不會洩漏到 client bundle。

### 3. 快取策略

```
靜態內容（文章列表、標籤）
→ Next.js 自動快取，更新時用 revalidatePath()

動態內容（留言、按讚數）
→ 不快取，每次請求重新獲取
```

### 4. 路由保護

```
proxy.ts (root, Next 16 — 即過去的 middleware.ts) 負責：
1. 透過 lib/supabase/middleware.ts 刷新 session cookies
2. 對所有 /admin/* (除 /admin/login) 檢查 user，未登入 → /admin/login
3. 已登入但訪問 /admin/login → /admin

個別 admin 頁面不需要再做驗證邏輯（authed layout 額外做雙保險 redirect）。
```

### 5. 內容格式與 sanitize

```
寫入流程（後台 server action）：
Tiptap getHTML() → 透過 hidden input 進 FormData
  → server action 讀 FormData
  → sanitizeContentHtml() (DOMPurify 白名單)
       ├─ 放行 tag：p / br / 文字 marks / heading / list / a / img / figure /
       │           figcaption / hr / span / label / input / mark / iframe / div
       ├─ data-* 屬性全放行（task list / Figure data-align/size/rounded /
       │                     data-indent / data-youtube-video 都靠這條）
       └─ uponSanitizeElement hook：iframe 的 src 必須是
          youtube.com / youtube-nocookie.com / player.vimeo.com，否則整個 element 移除
  → dedupeFigureImages()  (清掉 figure 內 img 同 src 的孤立 raw img)
  → 寫入 posts.content (text)

讀取流程（前台 Server Component）：
posts.content (sanitized HTML)
  → <HtmlContent html={content} />
  → <div dangerouslySetInnerHTML={{ __html }} className="markdown" />
  → 套用 styles/themes/base.css 的 .markdown 樣式
```

---

## 主題系統架構

```
styles/themes/
├── base.css          ← 共用 CSS Variables 結構 + .markdown 內容樣式 + figure 圖片對齊/尺寸 CSS
├── light.css         ← 淺色主題值
└── dark.css          ← 深色主題值

運作方式：
<html data-theme="light" | "dark">
inline script 在 <head> 從 localStorage 讀 theme，避免 FOUC
ThemeToggle (Client Component) 切換並寫回 localStorage

之後加多套主題（Phase 4）：
新增 styles/themes/{hacker,warm}.css → 對應 data-theme 值即可
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
