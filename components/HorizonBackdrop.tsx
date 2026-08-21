"use client";

import { useEffect, useState } from "react";

/**
 * The horizon: layered bands drifting at different rates, suggesting water
 * and mountain without depicting either literally. Reads as weather, not as
 * animation — sixty-second loop, low amplitude, no bounce, no particles.
 * Paused when the tab is hidden (CSS animations pause with visibility via
 * the `paused` class toggle); skipped entirely under reduced motion, where
 * a static gradient carries the same light.
 *
 * The light is keyed to the local hour: a shift starting in darkness signs
 * on under a pre-dawn horizon, a day shift under daylight.
 */
export function HorizonBackdrop({ className = "" }: { className?: string }) {
  const [phase, setPhase] = useState<"night" | "dawn" | "day" | "dusk">("night");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setPhase(hour < 6 ? "night" : hour < 9 ? "dawn" : hour < 18 ? "day" : hour < 21 ? "dusk" : "night");
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Band colours mix the working palette by phase — landscape light, no
  // literal imagery. Values derive from the tokens so a palette swap
  // carries through.
  const bands: Record<typeof phase, [string, string, string]> = {
    night: [
      "color-mix(in srgb, var(--sn-bg) 82%, var(--sn-accent))",
      "color-mix(in srgb, var(--sn-bg) 65%, var(--sn-accent))",
      "color-mix(in srgb, var(--sn-bg) 90%, black)",
    ],
    dawn: [
      "color-mix(in srgb, var(--sn-bg) 60%, var(--sn-pending))",
      "color-mix(in srgb, var(--sn-bg) 55%, var(--sn-accent))",
      "color-mix(in srgb, var(--sn-bg) 80%, black)",
    ],
    day: [
      "color-mix(in srgb, var(--sn-bg) 55%, var(--sn-accent-soft))",
      "color-mix(in srgb, var(--sn-bg) 45%, var(--sn-accent))",
      "color-mix(in srgb, var(--sn-bg) 75%, var(--sn-ink-muted))",
    ],
    dusk: [
      "color-mix(in srgb, var(--sn-bg) 65%, var(--sn-pending))",
      "color-mix(in srgb, var(--sn-bg) 58%, var(--sn-accent))",
      "color-mix(in srgb, var(--sn-bg) 85%, black)",
    ],
  };

  const [a, b, c] = bands[phase];

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className={`horizon-band absolute inset-x-[-20%] top-[30%] h-[45%] opacity-70 ${paused ? "[animation-play-state:paused]" : ""}`}
        style={{ background: `linear-gradient(to bottom, transparent, ${a} 55%, transparent)` }}
      />
      <div
        className={`horizon-band-slow absolute inset-x-[-20%] top-[48%] h-[40%] opacity-50 ${paused ? "[animation-play-state:paused]" : ""}`}
        style={{ background: `linear-gradient(to bottom, transparent, ${b} 50%, transparent)` }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[35%]"
        style={{ background: `linear-gradient(to bottom, transparent, ${c})` }}
      />
    </div>
  );
}
