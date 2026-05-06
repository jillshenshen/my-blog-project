"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  name: string;
  defaultValue?: string;
  rows?: number;
};

export function MarkdownEditor({ name, defaultValue = "", rows = 22 }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview" | "split">("split");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] tracking-[0.3em] text-muted uppercase">
          Content (Markdown)
        </label>
        <div className="flex gap-1 text-[10px] tracking-[0.2em] uppercase">
          {(["write", "split", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`cursor-pointer border px-2 py-1 transition ${
                tab === t
                  ? "border-[var(--color-accent)] text-accent"
                  : "border-[var(--color-border)] text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 始終存在的隱藏 input：表單一律從這裡讀內容 */}
      <input type="hidden" name={name} value={value} />

      <div
        className={
          tab === "split"
            ? "grid grid-cols-1 gap-4 lg:grid-cols-2"
            : "grid grid-cols-1"
        }
      >
        {tab !== "preview" && (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={rows}
            spellCheck={false}
            placeholder="# 開始用 Markdown 寫文章..."
            className="w-full resize-y border border-[var(--color-border)] bg-surface p-4 font-mono text-sm leading-relaxed text-foreground outline-none transition focus:border-[var(--color-accent)]"
          />
        )}
        {tab !== "write" && (
          <div className="markdown overflow-y-auto border border-[var(--color-border)] bg-surface p-4 text-sm">
            {value.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-subtle">預覽會顯示在這裡...</p>
            )}
          </div>
        )}
      </div>

      <p className="text-[10px] text-subtle">
        ※ 預覽不含程式碼語法高亮（發布後前台會自動套 shiki）。
      </p>
    </div>
  );
}
