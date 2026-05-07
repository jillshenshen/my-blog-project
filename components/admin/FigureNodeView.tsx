"use client";

import { useEffect, useRef, useState } from "react";
import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";

const SIZE_OPTIONS: { label: string; value: string }[] = [
  { label: "小", value: "small" },
  { label: "中", value: "medium" },
  { label: "大", value: "large" },
  { label: "特大", value: "xlarge" },
  { label: "原始大小", value: "original" },
];

const ALIGN_OPTIONS: {
  value: "left" | "center" | "right";
  label: string;
  icon: string;
}[] = [
  { value: "left", label: "靠左", icon: "⊨" },
  { value: "center", label: "置中", icon: "≣" },
  { value: "right", label: "靠右", icon: "⊫" },
];

export function FigureNodeView({
  node,
  updateAttributes,
  selected,
  deleteNode,
}: NodeViewProps) {
  const align = (node.attrs.align as string) ?? "center";
  const size = (node.attrs.size as string) ?? "medium";
  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string) ?? "";
  const [sizeOpen, setSizeOpen] = useState(false);
  const sizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sizeOpen) return;
    function onClick(e: MouseEvent) {
      if (!sizeRef.current?.contains(e.target as Node)) setSizeOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [sizeOpen]);

  return (
    <NodeViewWrapper
      data-figure-wrapper
      className="figure-block"
      data-align={align}
      data-size={size}
    >
      <figure data-type="figure" data-align={align} data-size={size}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={selected ? "ring-2 ring-[var(--color-accent)]" : ""}
          draggable={false}
        />
        <figcaption data-placeholder="新增說明文字">
          <NodeViewContent />
        </figcaption>
      </figure>

      {selected ? (
        <div
          contentEditable={false}
          className="mt-2 inline-flex items-center gap-1 border border-[var(--color-border)] bg-background px-2 py-1.5 shadow-md"
        >
          {/* Alignment */}
          {ALIGN_OPTIONS.map((opt) => {
            const active = align === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => updateAttributes({ align: opt.value })}
                title={opt.label}
                aria-label={opt.label}
                className={`cursor-pointer rounded border px-2 py-1 text-xs transition ${
                  active
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-accent"
                    : "border-transparent text-foreground hover:border-[var(--color-border)]"
                }`}
              >
                {opt.icon}
              </button>
            );
          })}

          <span className="mx-1 h-5 w-px bg-[var(--color-border)]" />

          {/* Size */}
          <div className="relative" ref={sizeRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSizeOpen((v) => !v)}
              title="尺寸"
              className={`cursor-pointer rounded border px-2 py-1 text-xs transition ${
                sizeOpen
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-accent"
                  : "border-transparent text-foreground hover:border-[var(--color-border)]"
              }`}
            >
              {SIZE_OPTIONS.find((s) => s.value === size)?.label ?? "中"} ▼
            </button>
            {sizeOpen ? (
              <div className="absolute top-full left-0 z-30 mt-1 w-24 border border-[var(--color-border)] bg-background py-1 shadow-md">
                {SIZE_OPTIONS.map((opt) => {
                  const active = opt.value === size;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        updateAttributes({ size: opt.value });
                        setSizeOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-xs transition hover:bg-[var(--color-surface)] ${
                        active ? "text-accent" : "text-foreground"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {active ? <span>✓</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <span className="mx-1 h-5 w-px bg-[var(--color-border)]" />

          {/* Delete */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => deleteNode()}
            title="刪除圖片"
            aria-label="刪除圖片"
            className="cursor-pointer rounded border border-transparent px-2 py-1 text-xs text-red-500 transition hover:border-red-500/40"
          >
            🗑
          </button>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}
