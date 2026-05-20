"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AlbumImage } from "@/lib/types/album";

type Props = {
  images: AlbumImage[];
};

function formatTakenAt(takenAt: string | null): string {
  if (!takenAt) return "";
  // 後端傳回 YYYY-MM-DD，直接拆解避免時區位移
  const [y, m, d] = takenAt.split("-");
  if (!y || !m || !d) return takenAt;
  return `${y}.${m}.${d}`;
}

export function AlbumLightbox({ images }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // 只接受橫向滑動（避免跟垂直捲動衝突）
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  }

  // 隨著每張照片依序 fade in，捲動讓該張照片可見
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    images.forEach((_, idx) => {
      const t = setTimeout(() => {
        itemRefs.current[idx]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, idx * 1000);
      timers.push(t);
    });
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [images]);

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
  }, [images.length]);
  const prev = useCallback(() => {
    setOpenIndex((i) =>
      i === null ? null : (i - 1 + images.length) % images.length,
    );
  }, [images.length]);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    // 鎖住背景捲動
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [openIndex, close, next, prev]);

  useEffect(() => {
    if (openIndex !== null) closeBtnRef.current?.focus();
  }, [openIndex]);

  const current = openIndex !== null ? images[openIndex] : null;

  return (
    <>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {images.map((img, idx) => (
          <li
            key={img.id}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            style={{
              opacity: 0,
              animation: "album-photo-fade-in 0.6s ease-out forwards",
              animationDelay: `${idx * 1000}ms`,
            }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(idx)}
              className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden bg-[var(--color-border)]"
              aria-label={`打開照片 ${idx + 1}${img.alt ? `：${img.alt}` : ""}`}
            >
              <Image
                src={img.url}
                alt={img.alt || `相簿照片 ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="相片燈箱"
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          onClick={(e) => {
            // 點到背景 (target === currentTarget) 時才關
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
            <span className="text-[11px] tracking-[0.3em] uppercase opacity-70">
              {openIndex! + 1} / {images.length}
            </span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={close}
              aria-label="關閉燈箱"
              className="cursor-pointer text-[11px] tracking-[0.3em] uppercase transition hover:opacity-70"
            >
              關閉 ✕
            </button>
          </div>

          {/* Image */}
          <div
            className="relative flex flex-1 items-center justify-center px-4 sm:px-12"
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative h-full w-full">
              <Image
                key={current.id}
                src={current.url}
                alt={current.alt || `相簿照片 ${openIndex! + 1}`}
                fill
                sizes="100vw"
                priority
                className="object-contain"
              />
            </div>

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="上一張"
                  className="absolute top-1/2 left-6 hidden -translate-y-1/2 cursor-pointer p-3 text-3xl text-white/80 transition hover:text-white sm:block"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="下一張"
                  className="absolute top-1/2 right-6 hidden -translate-y-1/2 cursor-pointer p-3 text-3xl text-white/80 transition hover:text-white sm:block"
                >
                  ›
                </button>
              </>
            ) : null}
          </div>

          {/* Caption */}
          {current.caption || current.takenAt ? (
            <div className="bg-black/60 px-4 py-4 text-center text-white sm:px-6">
              {current.caption ? (
                <p className="text-sm sm:text-base">{current.caption}</p>
              ) : null}
              {current.takenAt ? (
                <p className="mt-1 text-[10px] tracking-[0.3em] uppercase opacity-60">
                  {formatTakenAt(current.takenAt)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
