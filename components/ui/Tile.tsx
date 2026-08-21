import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * The record-type tile: the core of the Field mental model — "tap what kind
 * of thing you have." Large, icon-led, full-width in a two-column grid,
 * comfortably hit with a thumb in the dark.
 */
export function Tile({
  icon,
  label,
  hint,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <button
      className={`pressable flex min-h-28 flex-col items-start justify-between gap-2 rounded-lg border border-line bg-surface p-4 text-left hover:border-line-strong ${className}`}
      {...props}
    >
      <span aria-hidden className="text-accent [&>svg]:h-7 [&>svg]:w-7">
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="font-display text-body-lg font-medium leading-tight">{label}</span>
        {hint && <span className="text-caption text-ink-muted">{hint}</span>}
      </span>
    </button>
  );
}
