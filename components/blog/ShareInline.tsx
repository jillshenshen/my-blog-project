"use client";

import { useState } from "react";

type Props = {
  url: string;
  title: string;
};

const COPIED_RESET_MS = 1500;

function IconCopy() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07l-1 1" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07l1-1" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.3-1.6 1.6-1.6h1.7V4.5c-.3 0-1.3-.1-2.5-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5V14h2.7v8h3.3Z" />
    </svg>
  );
}

function IconLine() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.2 7.9.3.1.7.2.8.5.1.3.1.7 0 1l-.1.7c-.1.3-.2 1.1.9.6 1.1-.5 6-3.5 8.1-6 1.5-1.7 2.1-3.4 2.1-4.7C22 6.6 17.5 3 12 3Zm-3.4 9.1H6.5c-.2 0-.3-.1-.3-.3V8.4c0-.2.1-.3.3-.3s.3.1.3.3v3h1.8c.2 0 .3.1.3.3s-.1.4-.3.4Zm1.4-.3c0 .2-.1.3-.3.3s-.3-.1-.3-.3V8.4c0-.2.1-.3.3-.3s.3.1.3.3v3.4Zm4 0c0 .2-.1.2-.2.3h-.3s-.1-.1-.1-.1L11.6 9.4v2.4c0 .2-.1.3-.3.3s-.3-.1-.3-.3V8.4c0-.1.1-.2.2-.3h.3s.1.1.1.1l1.8 2.5V8.4c0-.2.1-.3.3-.3s.3.1.3.3v3.4Zm2.6-2c.2 0 .3.1.3.3s-.1.3-.3.3h-1.5v1h1.5c.2 0 .3.1.3.3s-.1.3-.3.3h-1.8c-.2 0-.3-.1-.3-.3V8.4c0-.2.1-.3.3-.3h1.8c.2 0 .3.1.3.3s-.1.3-.3.3h-1.5v1Z" />
    </svg>
  );
}

export function ShareInline({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedTitle}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      window.prompt("複製這個連結：", url);
    }
  }

  const iconClass =
    "inline-flex h-7 w-7 items-center justify-center text-accent transition hover:opacity-70";

  return (
    <div className="flex items-center gap-2 text-muted">
      <span className="text-[10px] tracking-[0.3em] uppercase">Share:</span>
      <button
        type="button"
        onClick={copyLink}
        className={`${iconClass} cursor-pointer`}
        aria-label={copied ? "已複製連結" : "複製連結"}
        title={copied ? "已複製" : "複製連結"}
      >
        {copied ? (
          <span className="text-xs">✓</span>
        ) : (
          <IconCopy />
        )}
      </button>
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={iconClass}
        aria-label="分享到 LINE"
        title="分享到 LINE"
      >
        <IconLine />
      </a>
      <a
        href={fbUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={iconClass}
        aria-label="分享到 Facebook"
        title="分享到 Facebook"
      >
        <IconFacebook />
      </a>
    </div>
  );
}
