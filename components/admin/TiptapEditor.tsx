"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Extension } from "@tiptap/core";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

// 擴充 Image：當 <img> 在 figure[data-type="figure"] 裡面時跳過解析，
// 交給 Figure extension 處理（避免同一張圖被 Image + Figure 重複渲染）
const NestedAwareImage = Image.extend({
  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (node) => {
          const el = node as HTMLElement;
          let parent = el.parentElement;
          while (parent) {
            if (
              parent.tagName.toLowerCase() === "figure" &&
              parent.getAttribute("data-type") === "figure"
            ) {
              return false;
            }
            parent = parent.parentElement;
          }
          return null;
        },
      },
    ];
  },
});
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import { Highlight } from "@tiptap/extension-highlight";
import { TextAlign } from "@tiptap/extension-text-align";
import { Youtube } from "@tiptap/extension-youtube";
import { Figure } from "@/components/admin/FigureExtension";
import { Indent } from "@/components/admin/IndentExtension";
import { uploadImageAction } from "@/app/admin/(authed)/posts/upload-action";

// FontSize：透過 TextStyle 的 globalAttribute 增加 fontSize attr + 提供 commands
// (Tiptap v3 已宣告 setFontSize/unsetFontSize 型別，但 runtime 預設沒實作)
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              (element as HTMLElement).style.fontSize?.replace(/['"]+/g, "") ||
              null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run(),
    };
  },
});

type Props = {
  name: string;
  defaultValue?: string;
};

const labelClass =
  "cursor-pointer rounded border border-transparent px-2 py-1 text-xs text-foreground transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]";
const activeClass =
  "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-accent";

// 8x8 Blogger 風格色票（grayscale + 鮮豔 + 6 級色階 ×8 色相）
const COLOR_PALETTE: string[][] = [
  ["#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#efefef", "#ffffff"],
  ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#00acc1", "#1e88e5", "#5e35b1", "#d81b60"],
  ["#fad4d4", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3", "#d9d2e9", "#ead1dc"],
  ["#f4a4a4", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
  ["#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6fa8dc", "#8e7cc3", "#c27ba0"],
  ["#cc4125", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3d85c6", "#674ea7", "#a64d79"],
  ["#a61c00", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#0b5394", "#351c75", "#741b47"],
  ["#5b0f00", "#783f04", "#7f6000", "#274e13", "#0c343d", "#073763", "#20124d", "#4c1130"],
];

const FONT_SIZE_OPTIONS: { label: string; value: string | null }[] = [
  { label: "最小", value: "0.625rem" }, // 10px
  { label: "小", value: "0.875rem" }, // 14px
  { label: "一般", value: null }, // inherit (16px default)
  { label: "中", value: "1.125rem" }, // 18px
  { label: "大", value: "1.5rem" }, // 24px
  { label: "最大", value: "2rem" }, // 32px
];

type StyleAction = "h1" | "h2" | "h3" | "h4" | "p" | "clear";
const STYLE_OPTIONS: {
  label: string;
  action: StyleAction;
  preview: string;
}[] = [
  { label: "大標題", action: "h1", preview: "font-serif text-2xl" },
  { label: "標題", action: "h2", preview: "font-serif text-xl" },
  { label: "子標題", action: "h3", preview: "font-serif text-lg" },
  { label: "小標題", action: "h4", preview: "font-serif text-base font-semibold" },
  { label: "段落", action: "p", preview: "text-base" },
  { label: "一般", action: "clear", preview: "text-sm text-muted" },
];

// 每組 font-family 都有英 + 繁中 fallback，瀏覽器會依字元逐一挑選
const FONT_OPTIONS: { label: string; value: string | null }[] = [
  { label: "預設", value: null },
  {
    label: "黑體 / Sans",
    value:
      '"Inter", "Helvetica Neue", "PingFang TC", "Microsoft JhengHei", "Heiti TC", sans-serif',
  },
  {
    label: "明體 / Serif",
    value:
      '"Playfair Display", Georgia, "Songti TC", "PMingLiU", serif',
  },
  {
    label: "思源黑體",
    value: '"Noto Sans TC", "Source Han Sans TC", sans-serif',
  },
  {
    label: "思源宋體",
    value: '"Noto Serif TC", "Source Han Serif TC", serif',
  },
  {
    label: "蘋方 (Apple 系統)",
    value: '"PingFang TC", "PingFang HK", "PingFang SC", sans-serif',
  },
  {
    label: "金萱 (justfont)",
    value: '"jf-jinxuan", "jf-jinxuan-fresh", serif',
  },
  {
    label: "圓體 / Round",
    value:
      '"Comic Sans MS", "Yuanti TC", "STHeitiTC-Light", "Microsoft YaHei", sans-serif',
  },
  {
    label: "手寫 / Script",
    value: '"Dancing Script", "DFKai-SB", "BiauKai", cursive',
  },
  {
    label: "等寬 / Mono",
    value:
      'ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace',
  },
];

function ToolbarBtn({
  active = false,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`${labelClass} ${active ? activeClass : ""}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-[var(--color-border)]" />;
}

function ColorPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = (editor.getAttributes("textStyle").color as string) ?? null;

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(color: string | null) {
    if (color === null) editor.chain().focus().unsetColor().run();
    else editor.chain().focus().setColor(color).run();
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        title="文字顏色"
        aria-label="文字顏色"
        className={`${labelClass} flex items-center gap-1 ${open ? activeClass : ""}`}
      >
        <span className="font-serif">A</span>
        <span
          className="block h-1 w-4 rounded-sm"
          style={{ background: current ?? "var(--color-fg)" }}
        />
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-72 border border-[var(--color-border)] bg-background p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] tracking-[0.2em] text-muted uppercase">
              選取顏色
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(null)}
              className="cursor-pointer text-[10px] tracking-[0.2em] text-muted uppercase transition hover:text-foreground"
            >
              重設
            </button>
          </div>

          <div className="grid grid-cols-8 gap-1.5">
            {COLOR_PALETTE.flat().map((color) => {
              const active = current?.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(color)}
                  title={color}
                  className={`relative h-6 w-6 cursor-pointer rounded-full border transition ${
                    active
                      ? "border-foreground ring-2 ring-foreground"
                      : "border-[var(--color-border)] hover:scale-110"
                  }`}
                  style={{ background: color }}
                  aria-label={color}
                >
                  {active ? (
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[10px]"
                      style={{
                        color:
                          parseInt(color.slice(1), 16) > 0xaaaaaa
                            ? "#000"
                            : "#fff",
                      }}
                    >
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-3 border-t border-[var(--color-border)] pt-3">
            <label
              className="flex cursor-pointer items-center gap-2 text-[10px] tracking-[0.2em] text-muted uppercase"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] text-base">
                +
              </span>
              <span>自訂顏色</span>
              <input
                type="color"
                onChange={(e) => pick(e.target.value)}
                className="h-0 w-0 opacity-0"
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HighlightPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current =
    (editor.getAttributes("highlight").color as string) ?? null;

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(color: string | null) {
    if (color === null) editor.chain().focus().unsetHighlight().run();
    else editor.chain().focus().setHighlight({ color }).run();
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        title="背景顏色"
        aria-label="背景顏色"
        className={`${labelClass} flex items-center gap-1 ${open ? activeClass : ""}`}
      >
        <span
          className="rounded px-1 font-serif"
          style={{ background: current ?? "transparent" }}
        >
          A
        </span>
        <span className="text-[10px] text-muted">背景</span>
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-72 border border-[var(--color-border)] bg-background p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] tracking-[0.2em] text-muted uppercase">
              背景顏色
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(null)}
              className="cursor-pointer text-[10px] tracking-[0.2em] text-muted uppercase transition hover:text-foreground"
            >
              無
            </button>
          </div>

          <div className="grid grid-cols-8 gap-1.5">
            {COLOR_PALETTE.flat().map((color) => {
              const active = current?.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(color)}
                  title={color}
                  className={`relative h-6 w-6 cursor-pointer rounded-full border transition ${
                    active
                      ? "border-foreground ring-2 ring-foreground"
                      : "border-[var(--color-border)] hover:scale-110"
                  }`}
                  style={{ background: color }}
                  aria-label={color}
                />
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-3 border-t border-[var(--color-border)] pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-[10px] tracking-[0.2em] text-muted uppercase">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] text-base">
                +
              </span>
              <span>自訂顏色</span>
              <input
                type="color"
                onChange={(e) => pick(e.target.value)}
                className="h-0 w-0 opacity-0"
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Align = "left" | "center" | "right" | "justify";
const ALIGN_OPTIONS: { label: string; value: Align; icon: string }[] = [
  { label: "靠左對齊", value: "left", icon: "≡L" },
  { label: "置中對齊", value: "center", icon: "≡C" },
  { label: "靠右對齊", value: "right", icon: "≡R" },
  { label: "左右對齊", value: "justify", icon: "≡J" },
];

function AlignPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentValue =
    (ALIGN_OPTIONS.find((o) => editor.isActive({ textAlign: o.value }))
      ?.value as Align | undefined) ?? "left";
  const currentLabel =
    ALIGN_OPTIONS.find((o) => o.value === currentValue)?.label ?? "對齊";

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(value: Align) {
    editor.chain().focus().setTextAlign(value).run();
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        title="對齊"
        aria-label="對齊"
        className={`${labelClass} flex items-center gap-1 ${open ? activeClass : ""}`}
      >
        <span className="font-mono text-xs">≡</span>
        <span className="text-[10px] text-muted">{currentLabel.slice(0, 2)}</span>
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-36 border border-[var(--color-border)] bg-background py-1 shadow-md">
          {ALIGN_OPTIONS.map((opt) => {
            const active = opt.value === currentValue;
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(opt.value)}
                className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 transition hover:bg-[var(--color-surface)] ${
                  active ? "text-accent" : "text-foreground"
                }`}
              >
                <span className="font-mono text-xs">{opt.icon}</span>
                <span className="flex-1 text-left text-sm">{opt.label}</span>
                {active ? <span className="text-[10px]">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const SPECIAL_CHARS: { label: string; chars: string[] }[] = [
  {
    label: "標點",
    chars: [
      "—", "–", "…", "·", "•",
      "“", "”", "‘", "’",
      "「", "」", "『", "』",
      "《", "》", "〈", "〉",
      "（", "）", "【", "】",
    ],
  },
  {
    label: "符號",
    chars: ["©", "®", "™", "§", "¶", "†", "‡", "№", "℃", "℉", "°", "%", "‰", "&", "@", "#"],
  },
  {
    label: "箭頭",
    chars: ["←", "→", "↑", "↓", "↔", "↕", "⇐", "⇒", "⇑", "⇓", "⇔", "↰", "↱", "↲", "↳", "↺", "↻", "➤"],
  },
  {
    label: "數學",
    chars: ["±", "×", "÷", "≈", "≠", "≤", "≥", "∞", "√", "∑", "∏", "∫", "π", "Δ", "Ω", "α", "β", "γ"],
  },
  {
    label: "貨幣",
    chars: ["$", "€", "£", "¥", "₩", "₹", "₽", "¢"],
  },
  {
    label: "形狀",
    chars: ["★", "☆", "♥", "♡", "♦", "♣", "♠", "●", "○", "◆", "◇", "■", "□", "▲", "△", "▼", "▽", "✓", "✗", "✦"],
  },
];

function SpecialCharPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(ch: string) {
    editor.chain().focus().insertContent(ch).run();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        title="特殊字元"
        aria-label="特殊字元"
        className={`${labelClass} ${open ? activeClass : ""}`}
      >
        Ω
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 max-h-96 w-80 overflow-y-auto border border-[var(--color-border)] bg-background p-3 shadow-lg">
          {SPECIAL_CHARS.map((group) => (
            <div key={group.label} className="mb-3 last:mb-0">
              <div className="mb-1.5 text-[10px] tracking-[0.2em] text-muted uppercase">
                {group.label}
              </div>
              <div className="grid grid-cols-9 gap-1">
                {group.chars.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(ch)}
                    title={ch}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-transparent text-base transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SizePicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined) ?? null;
  const currentLabel =
    FONT_SIZE_OPTIONS.find((o) => o.value === currentSize)?.label ?? "一般";

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(value: string | null) {
    if (value === null) editor.chain().focus().unsetFontSize().run();
    else editor.chain().focus().setFontSize(value).run();
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        title="文字大小"
        aria-label="文字大小"
        className={`${labelClass} flex items-center gap-1 ${open ? activeClass : ""}`}
      >
        <span className="text-[10px] text-muted">大小</span>
        <span>{currentLabel}</span>
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-32 border border-[var(--color-border)] bg-background py-1 shadow-md">
          {FONT_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(opt.value)}
              className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 transition hover:bg-[var(--color-surface)] ${
                (currentSize ?? null) === opt.value
                  ? "text-accent"
                  : "text-foreground"
              }`}
              style={{ fontSize: opt.value ?? "1rem" }}
            >
              <span>{opt.label}</span>
              {(currentSize ?? null) === opt.value ? (
                <span className="text-[10px]">✓</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StylePicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  let currentLabel = "一般";
  if (editor.isActive("heading", { level: 1 })) currentLabel = "大標題";
  else if (editor.isActive("heading", { level: 2 })) currentLabel = "標題";
  else if (editor.isActive("heading", { level: 3 })) currentLabel = "子標題";
  else if (editor.isActive("heading", { level: 4 })) currentLabel = "小標題";
  else if (editor.isActive("paragraph")) currentLabel = "段落";

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(action: StyleAction) {
    const chain = editor.chain().focus();
    switch (action) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
        chain.toggleHeading({ level: Number(action[1]) as 1 | 2 | 3 | 4 }).run();
        break;
      case "p":
        chain.setParagraph().run();
        break;
      case "clear":
        chain.setParagraph().unsetAllMarks().run();
        break;
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        title="段落樣式"
        aria-label="段落樣式"
        className={`${labelClass} flex items-center gap-1 ${open ? activeClass : ""}`}
      >
        <span>{currentLabel}</span>
        <span className="text-[10px] text-muted">▼</span>
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-32 border border-[var(--color-border)] bg-background py-1 shadow-md">
          {STYLE_OPTIONS.map((opt) => {
            const active = opt.label === currentLabel;
            return (
              <button
                key={opt.label}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(opt.action)}
                className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 transition hover:bg-[var(--color-surface)] ${
                  active ? "text-accent" : "text-foreground"
                }`}
              >
                <span className={opt.preview}>{opt.label}</span>
                {active ? <span className="text-[10px]">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FontPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current =
    (editor.getAttributes("textStyle").fontFamily as string | undefined) ?? null;
  const currentLabel =
    FONT_OPTIONS.find((f) => f.value === current)?.label ?? "字型";

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function pick(value: string | null) {
    if (value === null) editor.chain().focus().unsetFontFamily().run();
    else editor.chain().focus().setFontFamily(value).run();
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        title="字型"
        aria-label="字型"
        className={`${labelClass} flex items-center gap-1 ${open ? activeClass : ""}`}
      >
        <span style={{ fontFamily: current ?? undefined }}>Aa</span>
        <span className="text-[10px] text-muted">{currentLabel}</span>
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-48 border border-[var(--color-border)] bg-background py-1 shadow-md">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(f.value)}
              className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm transition hover:bg-[var(--color-surface)] ${
                current === f.value ? "text-accent" : "text-foreground"
              }`}
              style={{ fontFamily: f.value ?? undefined }}
            >
              <span>{f.label}</span>
              {current === f.value ? (
                <span className="text-[10px]">✓</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Toolbar({
  editor,
  onUploadImage,
}: {
  editor: Editor;
  onUploadImage: () => void;
}) {
  const insertLink = useCallback(() => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("連結網址", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank", rel: "noopener noreferrer" })
      .run();
  }, [editor]);

  const insertVideo = useCallback(() => {
    const url = window.prompt(
      "貼上 YouTube 連結（watch / youtu.be / embed 都可以）",
      "https://",
    );
    if (!url) return;
    const ok = editor
      .chain()
      .focus()
      .setYoutubeVideo({ src: url.trim() })
      .run();
    if (!ok) {
      alert("無法解析這個 YouTube 連結，請確認格式");
    }
  }, [editor]);

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border border-[var(--color-border)] border-b-0 bg-background px-2 py-1.5">
      <StylePicker editor={editor} />
      <Divider />
      <ToolbarBtn
        title="粗體 (Cmd+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarBtn>
      <ToolbarBtn
        title="斜體 (Cmd+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarBtn>
      <ToolbarBtn
        title="底線 (Cmd+U)"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarBtn>
      <ToolbarBtn
        title="刪除線"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </ToolbarBtn>
      <SizePicker editor={editor} />
      <ColorPicker editor={editor} />
      <HighlightPicker editor={editor} />
      <FontPicker editor={editor} />
      <ToolbarBtn
        title="行內程式碼"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <code className="font-mono">{`<>`}</code>
      </ToolbarBtn>
      <Divider />
      <ToolbarBtn
        title="連結"
        active={editor.isActive("link")}
        onClick={insertLink}
      >
        🔗
      </ToolbarBtn>
      <ToolbarBtn title="插入圖片" onClick={onUploadImage}>
        🖼️
      </ToolbarBtn>
      <ToolbarBtn title="插入 YouTube 影片" onClick={insertVideo}>
        ▶
      </ToolbarBtn>
      <SpecialCharPicker editor={editor} />
      <Divider />
      <ToolbarBtn
        title="條列清單"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </ToolbarBtn>
      <ToolbarBtn
        title="編號清單"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarBtn>
      <ToolbarBtn
        title="待辦清單"
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        ☑
      </ToolbarBtn>
      <Divider />
      <AlignPicker editor={editor} />
      <ToolbarBtn
        title="減少縮排"
        onClick={() => editor.chain().focus().outdent().run()}
      >
        ⇤
      </ToolbarBtn>
      <ToolbarBtn
        title="增加縮排"
        onClick={() => editor.chain().focus().indent().run()}
      >
        ⇥
      </ToolbarBtn>
      <Divider />
      <ToolbarBtn
        title="引用"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        &ldquo;
      </ToolbarBtn>
      <ToolbarBtn
        title="程式碼區塊"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        {"{}"}
      </ToolbarBtn>
      <ToolbarBtn
        title="分隔線"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        ―
      </ToolbarBtn>
      <Divider />
      <ToolbarBtn
        title="復原 (Cmd+Z)"
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↶
      </ToolbarBtn>
      <ToolbarBtn
        title="重做 (Cmd+Shift+Z)"
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↷
      </ToolbarBtn>
    </div>
  );
}

export function TiptapEditor({ name, defaultValue = "" }: Props) {
  const [html, setHtml] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File, editor: Editor) => {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const result = await uploadImageAction(fd);
        if (result.ok) {
          editor.chain().focus().insertFigure({ src: result.url }).run();
        } else {
          alert(`上傳失敗：${result.error}`);
        }
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Youtube.configure({
        inline: false,
        controls: true,
        nocookie: true,
        HTMLAttributes: { class: "my-6 w-full" },
      }),
      Indent,
      // 舊文章相容用：保留 Image 解析既有 <img>（不在 figure 裡的），新插入一律走 Figure
      NestedAwareImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: "my-6 max-w-full" },
      }),
      Figure,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({
        placeholder: "開始寫吧 — 直接貼/拖照片進來會自動上傳",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: defaultValue || undefined,
    editorProps: {
      attributes: {
        class:
          "markdown min-h-[400px] border border-[var(--color-border)] bg-surface p-6 text-base leading-relaxed text-foreground outline-none",
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageItem = items.find((i) => i.type.startsWith("image/"));
        if (!imageItem) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        event.preventDefault();
        if (editor) void uploadFile(file, editor);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []);
        const images = files.filter((f) => f.type.startsWith("image/"));
        if (images.length === 0) return false;
        event.preventDefault();
        if (editor) {
          for (const f of images) void uploadFile(f, editor);
        }
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML());
    },
    immediatelyRender: false,
  });

  function triggerImageUpload() {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void uploadFile(file, editor);
    };
    input.click();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] tracking-[0.3em] text-muted uppercase">
          Content
        </label>
        {uploading ? (
          <span className="text-[10px] tracking-[0.2em] text-accent uppercase">
            Uploading...
          </span>
        ) : null}
      </div>
      <input type="hidden" name={name} value={html} />
      {editor ? (
        <div>
          <Toolbar editor={editor} onUploadImage={triggerImageUpload} />
          <EditorContent editor={editor} />
        </div>
      ) : (
        <div className="min-h-[400px] border border-[var(--color-border)] bg-surface p-6 text-sm text-subtle">
          Loading editor…
        </div>
      )}
      <p className="text-[10px] text-subtle">
        ※ 直接拖拉或 Cmd+V 貼上照片會自動上傳到 Storage（最大 10MB / 張）。
      </p>
    </div>
  );
}
