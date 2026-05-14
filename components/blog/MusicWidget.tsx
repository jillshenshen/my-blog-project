"use client";

import { useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/types/track";

type Props = {
  tracks: Track[];
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function IconPlay() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M6 5h4v14H6V5Zm8 0h4v14h-4V5Z" />
    </svg>
  );
}

function IconPrev() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M6 5h2v14H6V5Zm3.5 7 8.5 6V6l-8.5 6Z" />
    </svg>
  );
}

function IconNext() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M16 5h2v14h-2V5ZM6 6v12l8.5-6L6 6Z" />
    </svg>
  );
}

export function MusicWidget({ tracks }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const current = tracks[index];

  // 切換歌曲時：載入新 src，視 playing 狀態決定要不要繼續播
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = current.audioUrl;
    audio.load();
    setCurrentTime(0);
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.audioUrl]);

  if (!current) return null;

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
  }

  function goPrev() {
    setIndex((i) => (i - 1 + tracks.length) % tracks.length);
  }
  function goNext() {
    setIndex((i) => (i + 1) % tracks.length);
  }

  function onSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="text-center">
      <p className="truncate font-serif text-base text-foreground">
        {current.title}
      </p>
      {current.artist ? (
        <p className="mt-1 truncate text-xs text-muted">{current.artist}</p>
      ) : null}

      <div className="mt-4 px-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={onSeek}
          aria-label="播放進度"
          className="music-range block w-full cursor-pointer"
          style={
            {
              background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${progressPct}%, var(--color-border) ${progressPct}%, var(--color-border) 100%)`,
            } as React.CSSProperties
          }
        />
        <div className="mt-1 flex justify-between text-[10px] text-subtle">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-5 text-foreground">
        <button
          type="button"
          onClick={goPrev}
          aria-label="上一首"
          className="cursor-pointer p-2 text-muted transition hover:text-foreground"
        >
          <IconPrev />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "暫停" : "播放"}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-foreground text-background transition hover:opacity-80"
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label="下一首"
          className="cursor-pointer p-2 text-muted transition hover:text-foreground"
        >
          <IconNext />
        </button>
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={goNext}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="hidden"
      />

      <style>{`
        .music-range {
          -webkit-appearance: none;
          appearance: none;
          height: 3px;
          border-radius: 9999px;
          outline: none;
        }
        .music-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: var(--color-foreground);
          cursor: pointer;
          border: 0;
        }
        .music-range::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: var(--color-foreground);
          cursor: pointer;
          border: 0;
        }
      `}</style>
    </div>
  );
}
