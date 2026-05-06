"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { uploadImageAction } from "@/app/admin/(authed)/posts/upload-action";

type Props = {
  name: string;
  defaultValue?: string;
};

export function CoverImageField({ name, defaultValue = "" }: Props) {
  const [url, setUrl] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick() {
    inputRef.current?.click();
  }

  function onChangeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so 同一張可重選
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadImageAction(fd);
      if (result.ok) setUrl(result.url);
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <label className="text-[10px] tracking-[0.3em] text-muted uppercase">
        Cover Image
      </label>
      <input type="hidden" name={name} value={url} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={onChangeFile}
      />

      {url ? (
        <div className="relative">
          <Image
            src={url}
            alt="封面預覽"
            width={1200}
            height={600}
            className="h-auto w-full max-w-md border border-[var(--color-border)] object-cover"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onPick}
              disabled={pending}
              className="cursor-pointer text-[10px] tracking-[0.3em] text-accent uppercase transition hover:opacity-70 disabled:opacity-30"
            >
              {pending ? "Uploading..." : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => setUrl("")}
              className="cursor-pointer text-[10px] tracking-[0.3em] text-muted uppercase transition hover:text-red-500"
            >
              Remove
            </button>
            <span className="truncate font-mono text-[10px] text-subtle">
              {url}
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          disabled={pending}
          className="flex h-32 w-full max-w-md cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-[var(--color-border)] bg-surface text-xs text-muted transition hover:border-[var(--color-accent)] hover:text-foreground disabled:opacity-50"
        >
          <span className="text-2xl" aria-hidden>
            +
          </span>
          {pending ? "上傳中…" : "點擊選擇封面圖（最大 10MB）"}
        </button>
      )}

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
