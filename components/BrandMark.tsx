"use client";

import { useState } from "react";
import { identity, logo } from "@/config/branding";

/**
 * The Nation's brand mark. The logo is supplied by the Nation — never
 * generated or approximated. config/branding.ts points at the supplied
 * asset; while the file is absent (or fails to load) a clearly marked
 * neutral placeholder holds the space at the correct aspect ratio.
 *
 * On dark surfaces the mark sits on a light chip (the wordmark carries
 * black text) — the asset itself is never altered. Required formats are
 * documented in docs/BRANDING.md.
 */
export function BrandMark({
  variant = "full",
  className = "",
}: {
  /** "full" for sign-in, headers, and documents; "compact" for the mobile header. */
  variant?: "full" | "compact";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const compact = variant === "compact";
  const aspectRatio = compact ? logo.compactAspectRatio : logo.aspectRatio;
  const src = compact ? logo.compact : logo.light;

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${identity.nation} logo placeholder`}
        style={{ aspectRatio }}
        className={`flex items-center justify-center rounded-sm border border-dashed border-line-strong bg-surface text-ink-muted ${
          compact ? "text-[11px]" : "text-caption"
        } ${className}`}
      >
        {compact ? "SN" : `${identity.nation} logo`}
      </div>
    );
  }

  return (
    <span className={`brand-chip inline-flex ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${identity.nation} logo`}
        style={{ aspectRatio }}
        className="h-auto w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
