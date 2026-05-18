"use client";

import { SubmittingButton } from "./SubmittingButton";

const CHECKBOX_SELECTOR = 'input[type="checkbox"][name^="delete_"]';

export function BatchDeleteAlbumImagesBar() {
  function selectAll(checked: boolean) {
    document
      .querySelectorAll<HTMLInputElement>(CHECKBOX_SELECTOR)
      .forEach((b) => {
        b.checked = checked;
      });
  }

  function onDeleteClick(e: React.MouseEvent<HTMLButtonElement>) {
    const checked = document.querySelectorAll<HTMLInputElement>(
      `${CHECKBOX_SELECTOR}:checked`,
    );
    if (checked.length === 0) {
      e.preventDefault();
      alert("請先勾選要刪除的照片");
      return;
    }
    const ok = confirm(
      `確定要刪除選取的 ${checked.length} 張照片？此操作無法復原。`,
    );
    if (!ok) e.preventDefault();
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border border-[var(--color-border)] p-3">
      <button
        type="button"
        onClick={() => selectAll(true)}
        className="cursor-pointer text-[10px] tracking-[0.3em] text-muted uppercase transition hover:text-foreground"
      >
        全選
      </button>
      <button
        type="button"
        onClick={() => selectAll(false)}
        className="cursor-pointer text-[10px] tracking-[0.3em] text-muted uppercase transition hover:text-foreground"
      >
        取消全選
      </button>
      <div className="ml-auto">
        <SubmittingButton
          pendingText="刪除中…"
          onClick={onDeleteClick}
          className="cursor-pointer border border-red-500 px-4 py-2 text-[11px] tracking-[0.3em] text-red-500 uppercase transition hover:bg-red-500 hover:text-white"
        >
          刪除選取
        </SubmittingButton>
      </div>
    </div>
  );
}
