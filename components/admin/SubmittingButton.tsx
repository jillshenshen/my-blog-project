"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

// 配合 server action 使用。必須是 <form> 的子節點才能讀到 pending 狀態
// （透過 form="..." 屬性掛上來的 button 不算 child，這個元件對它無效）
export function SubmittingButton({
  children,
  pendingText,
  className,
  onClick,
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={onClick}
      aria-busy={pending}
      className={`${className ?? ""} inline-flex items-center justify-center gap-2 ${
        pending ? "cursor-wait opacity-60" : ""
      }`}
    >
      {pending ? <Spinner /> : null}
      <span>{pending ? pendingText : children}</span>
    </button>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
