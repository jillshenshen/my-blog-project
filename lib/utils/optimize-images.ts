/**
 * 把文章 HTML 內的 <img> 重寫成走 Next.js Image Optimization API。
 *
 * 為什麼需要：Tiptap 編輯器吐出的 HTML 含原生 <img src="https://...supabase...">，
 * 直接從 Supabase Storage 拉原圖，單張可能 3-5 MB，整篇 9-10 MB，會把 LCP 拉到 7s+。
 * 改走 /_next/image 後 Next.js 會自動 resize + 轉 WebP + cache，下載量降約 90%。
 *
 * 此 transform 在 render time 執行（不是寫入時），所以舊文章也會被優化。
 */

const NEXT_IMAGE_PATH = "/_next/image";
const SUPABASE_PUBLIC_PATH = "/storage/v1/object/public/";

const WIDTHS = [640, 1080, 1920] as const;
const DEFAULT_WIDTH = 1080;
const QUALITY = 75;

function buildNextImageUrl(originalUrl: string, width: number): string {
  return `${NEXT_IMAGE_PATH}?url=${encodeURIComponent(originalUrl)}&w=${width}&q=${QUALITY}`;
}

export function optimizeArticleImages(html: string): string {
  return html.replace(/<img\b([^>]*?)\/?>/gi, (match, rawAttrs: string) => {
    const srcMatch = rawAttrs.match(/\bsrc\s*=\s*["']([^"']+)["']/);
    if (!srcMatch) return match;
    const src = srcMatch[1];

    if (src.startsWith(NEXT_IMAGE_PATH)) return match;

    // 清掉會被我們覆寫的屬性，避免重複
    const cleanedAttrs = rawAttrs
      .replace(
        /\b(srcset|sizes|loading|decoding|fetchpriority)\s*=\s*["'][^"']*["']/gi,
        "",
      )
      .trim();

    const isSupabaseImage = src.includes(SUPABASE_PUBLIC_PATH);
    const lazyAttrs = `loading="lazy" decoding="async"`;

    if (!isSupabaseImage) {
      return `<img ${cleanedAttrs} ${lazyAttrs}>`;
    }

    const attrsWithoutSrc = cleanedAttrs.replace(
      /\bsrc\s*=\s*["'][^"']+["']/,
      "",
    );
    const optimizedSrc = buildNextImageUrl(src, DEFAULT_WIDTH);
    const srcset = WIDTHS.map(
      (w) => `${buildNextImageUrl(src, w)} ${w}w`,
    ).join(", ");
    const sizes = "(max-width: 1024px) 100vw, 720px";

    return `<img ${attrsWithoutSrc} src="${optimizedSrc}" srcset="${srcset}" sizes="${sizes}" ${lazyAttrs}>`;
  });
}
