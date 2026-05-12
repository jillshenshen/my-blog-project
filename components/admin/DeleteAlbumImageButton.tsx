"use client";

type Props = {
  action: () => void | Promise<void>;
};

export function DeleteAlbumImageButton({ action }: Props) {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("確定要刪除這張照片？此操作無法復原。")) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={onSubmit} className="inline">
      <button
        type="submit"
        className="cursor-pointer text-[10px] tracking-[0.2em] text-red-500 uppercase transition hover:opacity-70"
      >
        Delete
      </button>
    </form>
  );
}
