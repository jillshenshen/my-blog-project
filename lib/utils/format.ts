export function formatDate(iso: string, locale = "en-US"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatYearMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}`;
}

// 從 HTML 內容抽純文字（去 tag、合併空白）給文章預覽用
// 加上 maxChars 上限避免把整篇文章送到 client
export function stripHtmlToText(html: string, maxChars = 240): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
}
