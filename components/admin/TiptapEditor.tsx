"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import { uploadImageAction } from "@/app/admin/(authed)/posts/upload-action";

type Props = {
  name: string;
  defaultValue?: string;
};

const labelClass =
  "cursor-pointer rounded border border-transparent px-2 py-1 text-xs text-foreground transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]";
const activeClass =
  "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-accent";

const COLOR_SWATCHES = [
  { name: "預設", value: null },
  { name: "薄荷綠", value: "#6cb39e" },
  { name: "紅", value: "#e15555" },
  { name: "橘", value: "#e89b3a" },
  { name: "黃", value: "#d4b021" },
  { name: "藍", value: "#3a82e8" },
  { name: "紫", value: "#9461d9" },
  { name: "灰", value: "#8a8a8a" },
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
        <div className="absolute top-full left-0 z-20 mt-1 grid w-44 grid-cols-4 gap-1.5 border border-[var(--color-border)] bg-background p-2 shadow-md">
          {COLOR_SWATCHES.map((s) => (
            <button
              key={s.name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s.value)}
              title={s.name}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-[var(--color-border)] transition hover:border-foreground"
              style={{
                background: s.value ?? "transparent",
                color: s.value ? "#fff" : "var(--color-fg)",
              }}
            >
              {s.value === null ? "×" : ""}
            </button>
          ))}
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

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border border-[var(--color-border)] border-b-0 bg-background px-2 py-1.5">
      <ToolbarBtn
        title="標題 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        H1
      </ToolbarBtn>
      <ToolbarBtn
        title="標題 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        H2
      </ToolbarBtn>
      <ToolbarBtn
        title="標題 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        H3
      </ToolbarBtn>
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
      <ColorPicker editor={editor} />
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
          editor.chain().focus().setImage({ src: result.url }).run();
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
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: "my-6 max-w-full" },
      }),
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
