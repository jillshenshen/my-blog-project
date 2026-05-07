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

type HandlePosition = "tl" | "tc" | "tr" | "ml" | "mr" | "bl" | "bc" | "br";

const RESIZE_HANDLES: { pos: HandlePosition; side: "left" | "right" }[] = [
  { pos: "tl", side: "left" },
  { pos: "tr", side: "right" },
  { pos: "ml", side: "left" },
  { pos: "mr", side: "right" },
  { pos: "bl", side: "left" },
  { pos: "br", side: "right" },
];

const DECORATIVE_HANDLES: HandlePosition[] = ["tc", "bc"];

export function FigureNodeView({
  node,
  updateAttributes,
  selected,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const align = (node.attrs.align as string) ?? "center";
  const size = (node.attrs.size as string) ?? "medium";
  const widthAttr = (node.attrs.width as string | null) ?? null;
  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string) ?? "";
  const [sizeOpen, setSizeOpen] = useState(false);
  const sizeRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sizeOpen) return;
    function onClick(e: MouseEvent) {
      if (!sizeRef.current?.contains(e.target as Node)) setSizeOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [sizeOpen]);

  function selectMe(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof getPos === "function") {
      const pos = getPos();
      if (typeof pos === "number") {
        editor.chain().setNodeSelection(pos).run();
      }
    }
  }

  function onResizeStart(side: "left" | "right", e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const figureEl = figureRef.current;
    if (!figureEl) return;
    const parentEl = figureEl.parentElement;
    if (!parentEl) return;

    const startX = e.clientX;
    const startWidth = figureEl.offsetWidth;
    const parentWidth = parentEl.clientWidth || 1;

    function onMove(ev: MouseEvent) {
      const delta = ev.clientX - startX;
      const nextPx = side === "right" ? startWidth + delta : startWidth - delta;
      const pct = Math.max(10, Math.min(100, (nextPx / parentWidth) * 100));
      if (figureEl) {
        figureEl.style.width = `${pct}%`;
        figureEl.style.maxWidth = "100%";
      }
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (figureEl) {
        const finalPct = parseFloat(figureEl.style.width || "0");
        if (Number.isFinite(finalPct) && finalPct > 0) {
          updateAttributes({ width: `${finalPct.toFixed(1)}%` });
        }
      }
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function pickSize(value: string) {
    // 切回預設尺寸時清除自訂 width
    updateAttributes({ size: value, width: null });
    setSizeOpen(false);
  }

  return (
    <NodeViewWrapper
      data-figure-wrapper
      className={`figure-block ${selected ? "is-selected" : ""}`}
      data-align={align}
      data-size={size}
    >
      <figure
        ref={figureRef}
        data-type="figure"
        data-align={align}
        data-size={size}
        style={
          widthAttr
            ? { width: widthAttr, maxWidth: "100%" }
            : undefined
        }
      >
        <div
          className="figure-image-container"
          onMouseDown={selectMe}
          onClick={selectMe}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} draggable={false} />
          {selected ? (
            <>
              <div className="figure-overlay" aria-hidden />
              {RESIZE_HANDLES.map(({ pos, side }) => (
                <span
                  key={pos}
                  className={`figure-handle figure-handle-${pos} figure-handle-active`}
                  onMouseDown={(e) => onResizeStart(side, e)}
                  aria-hidden
                />
              ))}
              {DECORATIVE_HANDLES.map((pos) => (
                <span
                  key={pos}
                  className={`figure-handle figure-handle-${pos}`}
                  aria-hidden
                />
              ))}
            </>
          ) : null}
        </div>
        <figcaption className="figure-caption">
          {node.content.size === 0 ? (
            <span
              contentEditable={false}
              className="figure-caption-placeholder"
            >
              新增說明文字
            </span>
          ) : null}
          <NodeViewContent />
        </figcaption>
      </figure>

      {selected ? (
        <div
          contentEditable={false}
          className="figure-toolbar mt-2 inline-flex items-center gap-1 border border-[var(--color-border)] bg-background px-2 py-1.5 shadow-md"
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
              {widthAttr
                ? widthAttr
                : (SIZE_OPTIONS.find((s) => s.value === size)?.label ?? "中")}{" "}
              ▼
            </button>
            {sizeOpen ? (
              <div className="absolute top-full left-0 z-30 mt-1 w-24 border border-[var(--color-border)] bg-background py-1 shadow-md">
                {SIZE_OPTIONS.map((opt) => {
                  const active = !widthAttr && opt.value === size;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickSize(opt.value)}
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
