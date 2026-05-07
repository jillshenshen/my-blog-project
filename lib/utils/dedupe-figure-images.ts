/**
 * 移除「跟 figure 內 img 同 src 的孤立 <img class="my-6 max-w-full">」
 *
 * 起因：早期 Tiptap Image extension 在解析 figure 內的 img 時會額外建立 Image node，
 * 導致存檔時同一張圖渲染兩次（一張在 figure 內、一張獨立的 raw img）。
 * 解析端已修，這個函式負責清掉舊資料留下來的重複 img。
 *
 * 邏輯：
 * 1. 抓所有 <figure data-type="figure">...<img src="X">...</figure> 的 src
 * 2. 找所有 <img class="my-6 max-w-full" src="X" ...>（legacy Image extension 渲染樣式）
 * 3. 若 X 出現在 figureImgSrcs，移除該 img
 * 4. 不在 figure 裡的 legacy img（例如 小樽水族館 那種純 img 文章）保留
 */
export function dedupeFigureImages(html: string): string {
  const figureImgSrcs = new Set<string>();
  const figureRegex =
    /<figure[^>]*data-type="figure"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/figure>/g;
  let m: RegExpExecArray | null;
  while ((m = figureRegex.exec(html)) !== null) {
    figureImgSrcs.add(m[1]);
  }

  if (figureImgSrcs.size === 0) return html;

  return html.replace(
    /<img\s+class="my-6 max-w-full"\s+src="([^"]+)"[^>]*>/g,
    (full, src) => (figureImgSrcs.has(src) ? "" : full),
  );
}
