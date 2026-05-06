"use client";

type Props = {
  title: string;
  action: () => void | Promise<void>;
};

export function DeletePostButton({ title, action }: Props) {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm(`確定要刪除「${title}」？此操作無法復原。`)) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={onSubmit} className="inline">
      <button
        type="submit"
        className="cursor-pointer text-[11px] tracking-[0.2em] text-red-500 uppercase transition hover:opacity-70"
      >
        Delete
      </button>
    </form>
  );
}
