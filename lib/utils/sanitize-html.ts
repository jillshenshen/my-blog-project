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
  "figure",
  "figcaption",
  "hr",
  "span",
  "label",
  "input", // task list checkbox
  "mark", // highlight
  "iframe", // YouTube / Vimeo embed（src 由下方 hook 限制信任 host）
  "div", // Tiptap Youtube extension 用 div[data-youtube-video] 包 iframe
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
  "style", // 文字顏色 / 對齊用，DOMPurify 仍會擋 javascript:/expression()/url()
  "width",
  "height",
  "allow",
  "allowfullscreen",
  "frameborder",
  "referrerpolicy",
];

const TRUSTED_IFRAME_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
]);

let hookInstalled = false;
function ensureHookInstalled() {
  if (hookInstalled) return;
  hookInstalled = true;
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName !== "iframe") return;
    const el = node as Element;
    const src = el.getAttribute("src") ?? "";
    let safe = false;
    try {
      const url = new URL(src);
      safe =
        url.protocol === "https:" && TRUSTED_IFRAME_HOSTS.has(url.hostname);
    } catch {
      safe = false;
    }
    if (!safe) {
      el.parentNode?.removeChild(el);
    }
  });
}

/**
 * 把 Tiptap 輸出的 HTML 內容做白名單清洗
 * - 移除 <script> / on* 屬性 / javascript: URL
 * - 保留 task list 必要的 data-attr
 * - 允許 style 屬性（給文字顏色 / 對齊用），但 DOMPurify 仍會清掉 dangerous CSS
 * - 允許 iframe 但限制 src host 為 YouTube / Vimeo（uponSanitizeElement hook）
 */
export function sanitizeContentHtml(html: string): string {
  ensureHookInstalled();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ["script", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onfocus"],
  });
}
