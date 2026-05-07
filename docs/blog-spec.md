# 個人技術部落格 產品規格書（PRD）

> **文件版本：** v1.1
> **建立日期：** 2026 年 4 月 28 日
> **最後更新：** 2026 年 5 月 7 日
> **文件狀態：** Phase 1 + Phase 2 主要功能完成並上線

---

## 1. 專案概述

本專案旨在建立一個具備完整功能的個人技術部落格，目標是透過高品質的技術文章積累讀者群，並透過搜尋引擎獲取自然流量。網站整體設計以 SEO 優化為核心，同時提供良好的閱讀體驗與豐富的個人化功能（相簿、音樂播放器、主題切換等），重現早期部落格平台（如無名小站）的溫度感。

### 1.1 目標

- 被搜尋引擎收錄，累積穩定的自然流量
- 提供良好的技術文章閱讀體驗
- 管理員可自主發布、管理文章與媒體內容
- 支援個人化主題，讓部落格展現個人風格

### 1.2 目標用戶

- **主要：** 對技術文章有興趣的工程師或學習者
- **次要：** 部落格作者本人（管理後台使用者）

---

## 2. 技術架構

| 層級 | 技術選型 | 說明 |
| --- | --- | --- |
| 前端框架 | Next.js 16 + TypeScript | App Router + Turbopack，SSR 友善 |
| 樣式 | Tailwind CSS v4 | CSS Variables 主題，mobile-first |
| 資料庫 | Supabase (PostgreSQL) | 文章、分類、標籤、（未來）留言/按讚 |
| 檔案儲存 | Supabase Storage `blog-images` bucket | 封面圖 + 內文圖片，10MB / 張上限 |
| 身份驗證 | Supabase Auth + `@supabase/ssr` | 管理員 Email/密碼登入，cookie session |
| 文章編輯器 | Tiptap v3 | WYSIWYG，支援字型 / 顏色 / 大小 / 圖片對齊 / 圖說 |
| 內容儲存格式 | sanitized HTML | 不存 Markdown；Tiptap 輸出 + DOMPurify 白名單 |
| 部署平台 | Vercel | GitHub 自動部署 |
| 音樂播放 | Spotify Embed (Phase 4) | 合法嵌入，免版權風險 |

> ⚠️ **內容格式變更說明**：Phase 2-B 原規劃用 Markdown 編輯器，後因部落格定位改為「日常生活 + 照片」（拖拉貼圖 UX 比語法重要），改用 Tiptap WYSIWYG，內容格式從 Markdown 改為 HTML。前台渲染從 unified/shiki pipeline 改為 `<div dangerouslySetInnerHTML />` + 伺服端 DOMPurify。

---

## 3. 功能規格

### 3.1 文章系統

#### 3.1.1 文章列表頁

- 顯示所有已發布文章，按發布時間倒序排列
- 每篇文章顯示：標題、摘要、標籤、發布日期、閱讀時間估算
- 支援標籤篩選
- 支援全文搜尋
- 分頁或無限捲動

#### 3.1.2 文章詳細頁

- HTML 內容渲染（Tiptap 輸出，含字型 / 顏色 / 文字大小 / 圖片對齊與圖說）
- 顯示閱讀時間估算（例：「約 5 分鐘閱讀」）
- 圖片支援 alignment（left / center / right）+ 5 級尺寸 + 拖拉 resize
- 圖片下方可選圖說文字（`<figcaption>`）
- ⏳ 待做：上一篇／下一篇導航、TOC、按讚、留言（Phase 2-D / Phase 3）

#### 3.1.3 分類 + 標籤系統

- **分類 (Category)**：每篇文章只屬於一個分類（透過 `posts.category_id` 外鍵）
- **標籤 (Tag)**：每篇文章可有多個標籤（透過 `post_tags` 多對多關聯）
- 分類頁 `/categories/[slug]`、標籤頁 `/tags/[slug]` 各自列出對應文章
- 月份歸檔頁 `/archive/[year]/[month]`
- Sidebar 顯示 About / Recent posts / Blog Archive (折疊年月) / Categories / Tags

#### 3.1.4 搜尋功能

- ✅ Phase 1 簡易版：ILIKE 比對標題 / excerpt / content（`/search?q=...`）
- ⏳ Phase 2-D 強化：改用 Postgres tsvector 全文搜尋向量 + GIN index

---

### 3.2 相簿系統

- 相簿列表：顯示所有相簿，附封面照片與相簿名稱
- 相簿詳細頁：格狀顯示相簿內所有照片
- 燈箱效果（Lightbox）：點擊照片放大，支援左右切換
- 相簿分類管理
- 照片上傳至 Supabase Storage，自動壓縮優化

---

### 3.3 音樂播放器

- 固定懸浮於頁面底部（類似 Spotify 底部播放 bar）
- 使用 Spotify Embed 嵌入，合法無版權疑慮
- 管理員在後台設定 Spotify 播放清單連結
- 支援最小化／展開切換
- 顯示歌曲名稱、歌手、專輯封面

---

### 3.4 主題與視覺系統

#### 3.4.1 深色 / 淺色模式

- 支援系統自動偵測（prefers-color-scheme）
- 使用者可手動切換，偏好設定儲存於 localStorage

#### 3.4.2 主題切換系統

- 提供多套預設主題（至少 3 套，例如：極簡白、深色駭客、溫暖橘）
- 每套主題控制：色系、字體、版面配置、元件圓角與陰影
- 管理員在後台一鍵切換主題
- 主題微調面板：可調整主色調、字體大小、圓角程度、字體選擇
- 所有視覺變數使用 CSS Custom Properties（CSS Variables）管理

---

### 3.5 SEO 功能

| 功能 | 說明 | 優先級 |
| --- | --- | --- |
| SSR 伺服器端渲染 | 所有頁面由 Next.js 伺服器渲染，確保爬蟲可讀取內容 | P0 |
| 動態 Meta Tags | 每篇文章獨立設定 title / description / canonical URL | P0 |
| Open Graph 預覽 | 分享至社群時顯示漂亮縮圖與標題 | P0 |
| Sitemap 自動產生 | 自動生成 sitemap.xml，提交至 Google Search Console | P0 |
| robots.txt | 引導爬蟲正確抓取頁面 | P0 |
| 結構化資料（JSON-LD） | Article schema，讓 Google 搜尋結果更豐富 | P1 |
| 圖片優化 | 使用 Next.js Image component 自動壓縮與 WebP 轉換 | P1 |
| RSS Feed | 讓讀者可透過 RSS 訂閱最新文章 | P1 |

---

### 3.6 管理員後台

#### 3.6.1 身份驗證

- 僅管理員可登入，使用 Supabase Auth
- 支援 Email + 密碼登入
- Session 管理，自動登出機制

#### 3.6.2 文章管理（已完成）

- ✅ 新增 / 編輯 / 刪除文章 (`/admin/posts/{,new,[id]/edit}`)
- ✅ Tiptap WYSIWYG 編輯器（標題分級 / 粗體 / 斜體 / 底線 / 刪除線 / 字型 / 文字大小 / 顏色 / 連結 / 圖片 / 清單 / 待辦 / 引用 / 程式碼 / 分隔線 / undo-redo）
- ✅ 圖片上傳：拖拉 / Cmd+V / 工具列按鈕 → 自動傳到 Supabase Storage
- ✅ 圖片可調整對齊（左/中/右）+ 5 級尺寸 + 拖拉 resize + 圖說文字
- ✅ 標題、摘要、封面圖、分類、多標籤、發布狀態
- ✅ 預覽：點 Preview 開新分頁 `/admin/preview?key=...`，不需先存檔
- ✅ 分類管理 `/admin/categories`（新增/rename/delete）
- ✅ 標籤管理 `/admin/tags`（rename/delete；建立可在文章表單裡直接新增）

#### 3.6.3 相簿管理

- 建立 / 刪除相簿
- 批次上傳照片
- 設定相簿封面

#### 3.6.4 主題設定

- 切換預設主題
- 微調主題參數（色系、字體、圓角）
- 設定 Spotify 播放清單連結

---

## 4. 非功能性需求

| 項目 | 需求 | 衡量標準 |
| --- | --- | --- |
| 效能 | 首頁載入速度快 | Lighthouse Performance 分數 ≥ 90 |
| 響應式設計 | 支援桌機、平板、手機 | 320px ~ 1440px 螢幕寬度正常顯示 |
| SEO 分數 | 基本 SEO 配置完整 | Lighthouse SEO 分數 ≥ 95 |
| 可用性 | 服務穩定 | Vercel 免費方案 SLA |
| 安全性 | 後台受身份驗證保護 | 未登入無法存取管理後台任何功能 |

---

## 5. 開發里程碑（分階段）

| 階段 | 功能範圍 | 狀態 |
| --- | --- | --- |
| Phase 1（MVP） | 文章列表、詳細頁、HTML 渲染、分類 + 標籤系統、月份歸檔、簡易搜尋、SEO 基礎、深淺主題、Vercel 部署 | ✅ 完成 |
| Phase 2-A | Supabase Auth、`/admin/login`、proxy.ts 路由保護、Dashboard 殼 | ✅ 完成 |
| Phase 2-B | 文章 CRUD、Tiptap WYSIWYG、tag 多選、草稿 / 發布、刪除確認、文章預覽 | ✅ 完成 |
| Phase 2-C | 圖片上傳 (`blog-images` Storage bucket)、封面圖、Tiptap 拖拉貼圖 | ✅ 完成 |
| Phase 2-D | 全文搜尋 (tsvector)、RSS Feed、動態 Open Graph 圖、上一篇/下一篇 | ⏳ 未開始 |
| Phase 3 | 留言、按讚、相簿系統、燈箱效果 | ⏳ 未開始 |
| Phase 4 | 音樂播放器（Spotify Embed）、主題切換系統、主題微調面板 | ⏳ 未開始 |
| Phase 5 | 結構化資料（JSON-LD）、效能優化、Search Console 提交 | ⏳ 未開始 |

---

## 6. 待確認事項（Open Questions）

- 留言功能是否需要使用者登入，或匿名留言即可？（待 Phase 3 開工前討論）
- 按讚是否要防止重複按讚（需記錄 IP 或要求登入）？
- 主題數量：初版預計幾套主題？
- 相簿照片是否有容量限制（Supabase 免費方案 Storage 上限為 1GB）？
- 域名（Domain）是否已有，或需要另外購買？目前用 Vercel 給的 `*.vercel.app`
- Google Search Console 是否需要在 Phase 2-D 之前完成驗證設定？

---

## 7. 附錄：完整功能清單

| 功能 | 類別 | 優先級 | 階段 | 狀態 |
| --- | --- | --- | --- | --- |
| 文章列表頁 | 文章 | P0 | Phase 1 | ✅ |
| 文章詳細頁 | 文章 | P0 | Phase 1 | ✅ |
| Tiptap WYSIWYG 編輯器 | 後台 | P0 | Phase 2-B | ✅ |
| 圖片上傳 + 對齊 + resize + 圖說 | 後台 | P0 | Phase 2-C | ✅ |
| 字型 / 顏色 / 文字大小 工具列 | 後台 | P1 | Phase 2-B | ✅ |
| 分類系統（每篇 1 分類） | 文章 | P0 | Phase 1 | ✅ |
| 標籤系統（每篇可多 tag） | 文章 | P0 | Phase 1 | ✅ |
| 月份歸檔頁（年/月折疊） | 文章 | P1 | Phase 1 | ✅ |
| 閱讀時間估算 | 文章 | P1 | Phase 1 | ✅ |
| 文章預覽 (`/admin/preview`) | 後台 | P1 | Phase 2-B | ✅ |
| 深色 / 淺色主題 | UI | P0 | Phase 1 | ✅ |
| 響應式設計 | UI | P0 | Phase 1 | ✅ |
| SEO Meta Tags | SEO | P0 | Phase 1 | ✅ |
| robots.txt + sitemap.xml | SEO | P0 | Phase 1 | ✅ |
| Open Graph | SEO | P0 | Phase 1 | ✅ |
| 簡易搜尋（ILIKE） | 文章 | P1 | Phase 1 | ✅ |
| 管理員後台 | 後台 | P0 | Phase 2-A | ✅ |
| 文章 CRUD | 後台 | P0 | Phase 2-B | ✅ |
| 分類 / 標籤管理頁 | 後台 | P1 | Phase 2-B | ✅ |
| 全文搜尋 (tsvector) | 文章 | P1 | Phase 2-D | ⏳ |
| RSS Feed | SEO | P1 | Phase 2-D | ⏳ |
| 動態 OG 圖 | SEO | P1 | Phase 2-D | ⏳ |
| 文章目錄（TOC） | 文章 | P1 | Phase 2-D | ⏳ |
| 上一篇 / 下一篇 | 文章 | P2 | Phase 2-D | ⏳ |
| 文章按讚 | 互動 | P1 | Phase 3 | ⏳ |
| 留言功能 | 互動 | P1 | Phase 3 | ⏳ |
| 相簿系統 | 相簿 | P1 | Phase 3 | ⏳ |
| 燈箱效果 | 相簿 | P2 | Phase 3 | ⏳ |
| 分享按鈕 | 互動 | P2 | Phase 3 | ⏳ |
| 音樂播放器 | 媒體 | P2 | Phase 4 | ⏳ |
| 主題切換系統 | UI | P1 | Phase 4 | ⏳ |
| 主題微調面板 | UI | P2 | Phase 4 | ⏳ |
| 結構化資料 JSON-LD | SEO | P1 | Phase 5 | ⏳ |
| 圖片自動優化 (WebP) | 效能 | P1 | Phase 5 | ⏳ |
