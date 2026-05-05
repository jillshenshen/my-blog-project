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
