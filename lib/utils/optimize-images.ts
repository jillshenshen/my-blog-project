/**
 * 對文章 HTML 內的 <img> 加上 loading="lazy" + decoding="async"
 *
 * 為什麼需要：Tiptap 編輯器吐出的 HTML 含原生 <img>，預設是 eager loading，
 * 會在頁面初始載入時同時下載所有圖片，跟封面圖搶頻寬，導致 LCP 偏高（曾經量到 7s+）。
 * 加上 lazy 後，非首屏圖片等捲動到附近才下載，封面圖能優先載入完成。
 *
 * 註：原本嘗試把 src 改寫成 /_next/image 走 Vercel 圖片優化，雖然下載量可省 9 成，
 *     但 Lighthouse 從美國測時 Vercel 圖片優化是冷快取，每張要 1-2s 的 transform，
 *     反而把 LCP 拉到 17s+，故拿掉。
 */

export function optimizeArticleImages(html: string): string {
  return html.replace(/<img\b([^>]*?)\/?>/gi, (match, rawAttrs: string) => {
    const cleanedAttrs = rawAttrs
      .replace(/\b(loading|decoding)\s*=\s*["'][^"']*["']/gi, "")
      .trim();
    return `<img ${cleanedAttrs} loading="lazy" decoding="async">`;
  });
}
