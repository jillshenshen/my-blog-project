/**
 * 渲染 Tiptap 儲存的 HTML 內容
 *
 * Server Component；HTML 已在 server action 寫入前用 DOMPurify 清洗，
 * 此處直接 dangerouslySetInnerHTML。樣式套用 .markdown class（在 styles/themes/base.css）。
 *
 * 渲染前先把 <img> 走 /_next/image 代理（resize + WebP），大幅降低 LCP。
 */

import { optimizeArticleImages } from "@/lib/utils/optimize-images";

type Props = {
  html: string;
};

export function HtmlContent({ html }: Props) {
  const optimized = optimizeArticleImages(html);
  return (
    <div
      className="markdown mx-auto max-w-2xl text-foreground"
      dangerouslySetInnerHTML={{ __html: optimized }}
    />
  );
}
