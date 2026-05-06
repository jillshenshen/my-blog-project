/**
 * 防呆：把 dynamic route param decode 回原始字串
 *
 * 起因：Next 16 Turbopack 在某些情況下不會自動 URL-decode params (特別是 non-ASCII)
 * 例如 /posts/小樽水族館 抵達 server 時 params.slug 仍為 "%E5%B0%8F..."
 *
 * 行為：
 * - 若 input 含 %xx 編碼 → decodeURIComponent
 * - 否則原值回傳
 * - decode 失敗（如殘缺 % 字串）→ 退回原值
 */
export function decodeParam(value: string): string {
  if (!/%[0-9A-Fa-f]{2}/.test(value)) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
