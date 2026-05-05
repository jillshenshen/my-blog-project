/**
 * 文章查詢層 (尚未接線到 Supabase)
 *
 * Phase 1 直接 re-export mock 資料，等 Supabase 接線後將實作改為真實查詢，
 * 呼叫端 (頁面 / 元件) 不需修改 import 路徑。
 */

export {
  getAllPosts,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  getPostsByYearMonth,
  getRecentPosts,
  searchPosts,
  getArchive,
} from "@/lib/data/mock-posts";
