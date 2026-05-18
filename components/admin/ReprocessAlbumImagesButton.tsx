"use client";

import { SubmittingButton } from "./SubmittingButton";

type Props = {
  action: () => void | Promise<void>;
  count: number;
};

export function ReprocessAlbumImagesButton({ action, count }: Props) {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const ok = confirm(
      `將重新壓縮這本相簿的 ${count} 張照片（max 2400px、WebP）。\n` +
        `舊檔會被取代並刪除，過程可能需要數十秒，期間請勿關閉頁面。\n\n` +
        `要繼續嗎？`,
    );
    if (!ok) e.preventDefault();
  }

  return (
    <form action={action} onSubmit={onSubmit} className="inline">
      <SubmittingButton
        pendingText="壓縮中…"
        className="border border-foreground px-4 py-2 text-[11px] tracking-[0.3em] text-foreground uppercase transition hover:bg-foreground hover:text-background"
      >
        重新壓縮所有照片
      </SubmittingButton>
    </form>
  );
}
