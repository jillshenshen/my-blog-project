"use client";

import Link from "next/link";
import { useState } from "react";
import type { ArchiveEntry } from "@/lib/supabase/queries/posts";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Props = {
  entries: ArchiveEntry[];
};

export function BlogArchive({ entries }: Props) {
  const [openYears, setOpenYears] = useState<Set<number>>(new Set());

  if (entries.length === 0) {
    return <p className="text-sm text-muted">尚無資料</p>;
  }

  function toggle(year: number) {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const isOpen = openYears.has(entry.year);
        return (
          <li key={entry.year}>
            <button
              type="button"
              onClick={() => toggle(entry.year)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2 text-sm text-foreground transition hover:text-muted"
            >
              <span
                className={`inline-block transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
                aria-hidden
              >
                ▸
              </span>
              <span>
                {entry.year}
                <span className="ml-1 text-muted">({entry.count})</span>
              </span>
            </button>

            {isOpen ? (
              <ul className="mt-2 ml-6 space-y-1.5 border-l border-[var(--color-border)] pl-3">
                {entry.months.map((m) => (
                  <li key={m.month}>
                    <Link
                      href={`/archive/${entry.year}/${String(m.month).padStart(2, "0")}`}
                      className="text-xs text-muted transition hover:text-foreground"
                    >
                      {MONTH_NAMES[m.month - 1]} {entry.year}
                      <span className="ml-1 text-subtle">({m.count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
