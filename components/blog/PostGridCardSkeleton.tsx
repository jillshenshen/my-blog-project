// 形狀對齊 PostGridCard：250x360、aspect-[3/2] cover、px-5 pt-5 pb-20 body
// 灰塊用 .skeleton-shimmer（base.css 定義，含掃光式 keyframe）
export function PostGridCardSkeleton() {
  return (
    <article className="relative flex h-[360px] w-[250px] flex-col border border-[var(--color-border)] bg-surface [[data-theme=dark]_&]:bg-[#1d1d20]">
      {/* cover 區 */}
      <div className="skeleton-shimmer aspect-[3/2] w-full" />

      <div className="flex flex-1 flex-col px-5 pt-5 pb-20">
        {/* 上排：分類 / 日期 */}
        <div className="flex items-center justify-between gap-3">
          <div className="skeleton-shimmer h-3 w-16" />
          <div className="skeleton-shimmer h-3 w-20" />
        </div>

        {/* 標題（兩行） */}
        <div className="mt-3 space-y-2">
          <div className="skeleton-shimmer h-4 w-5/6" />
          <div className="skeleton-shimmer h-4 w-3/5" />
        </div>

        {/* 摘要（兩行） */}
        <div className="mt-4 space-y-2">
          <div className="skeleton-shimmer h-3 w-full" />
          <div className="skeleton-shimmer h-3 w-4/5" />
        </div>
      </div>
    </article>
  );
}
