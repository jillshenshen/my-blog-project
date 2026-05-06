/**
 * 渲染 Tiptap 儲存的 HTML 內容
 *
 * Server Component；HTML 已在 server action 寫入前用 DOMPurify 清洗，
 * 此處直接 dangerouslySetInnerHTML。樣式套用 .markdown class（在 styles/themes/base.css）。
 */

type Props = {
  html: string;
};

export function HtmlContent({ html }: Props) {
  return (
    <div
      className="markdown mx-auto max-w-2xl text-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
