"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * Design-system rule (client direction): anything that expands shows a
 * chevron arrow — no hidden affordances. Used for program-level summaries,
 * individual report boxes, admin sections, and anywhere else content
 * collapses. The chevron rotates on open; under reduced motion it swaps
 * instantly.
 */
export function Disclosure({
  title,
  summary,
  defaultOpen = false,
  children,
  className = "",
}: {
  title: ReactNode;
  /** Optional line shown beside the title while collapsed (e.g. a count). */
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={`rounded-lg border border-line bg-surface ${className}`}>
      <button
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="pressable flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left"
      >
        <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
          <span className="font-display font-medium">{title}</span>
          {summary && !open && (
            <span className="shrink-0 text-caption text-ink-muted">{summary}</span>
          )}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-150 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div id={panelId} className="border-t border-line px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
