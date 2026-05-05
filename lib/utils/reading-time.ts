const WORDS_PER_MINUTE_EN = 220;
const CHARS_PER_MINUTE_CJK = 500;

export function calculateReadingTime(content: string): number {
  const cjkChars = (content.match(/[㐀-鿿가-힯]/g) ?? []).length;
  const remaining = content.replace(/[㐀-鿿가-힯]/g, "");
  const words = remaining
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const minutes = words / WORDS_PER_MINUTE_EN + cjkChars / CHARS_PER_MINUTE_CJK;
  return Math.max(1, Math.ceil(minutes));
}

export function formatReadingTime(minutes: number, locale: "zh" | "en" = "zh"): string {
  if (locale === "en") return `${minutes} min read`;
  return `約 ${minutes} 分鐘閱讀`;
}
