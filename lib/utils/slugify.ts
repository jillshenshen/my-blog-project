/**
 * 把標題轉成 URL-safe 的 slug
 * - 全小寫
 * - 空白 / 底線 / 標點 → 連字號
 * - 中文等非 ASCII 直接保留 unicode (URL 會自動編碼)
 * - 連續 - 合併為一個
 * - 頭尾 - 移除
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w一-鿿぀-ヿ가-힯-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
