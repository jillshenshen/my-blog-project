import "server-only";
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "s",
  "u",
  "code",
  "pre",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "hr",
  "span",
  "label",
  "input", // task list checkbox
];

const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "class",
  "data-type",
  "data-checked",
  "type", // input type=checkbox
  "checked",
  "disabled",
  "style", // 文字顏色用，DOMPurify 仍會擋 javascript:/expression()/url()
];

/**
 * 把 Tiptap 輸出的 HTML 內容做白名單清洗
 * - 移除 <script> / <iframe> / on* 屬性 / javascript: URL
 * - 保留 task list 必要的 data-attr
 * - 允許 style 屬性（給文字顏色用），但 DOMPurify 仍會清掉 dangerous CSS
 */
export function sanitizeContentHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onfocus"],
  });
}
