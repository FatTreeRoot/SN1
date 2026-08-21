"use client";

import { useEffect, useState } from "react";
import { IconAuto, IconMoon, IconSun } from "@/components/icons";

type Choice = "light" | "system" | "dark";

function surfaceDefault(): "light" | "dark" {
  // The Field layout stamps dark as its default before hydration; reading
  // the current attribute after clearing storage reproduces it.
  return document.documentElement.getAttribute("data-default-theme") === "dark" ||
    window.location.pathname.startsWith("/field")
    ? "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
}

function applyChoice(choice: Choice) {
  try {
    if (choice === "system") {
      localStorage.removeItem("sn-theme");
      document.documentElement.setAttribute("data-theme", surfaceDefault());
    } else {
      localStorage.setItem("sn-theme", choice);
      document.documentElement.setAttribute("data-theme", choice);
    }
  } catch {
    document.documentElement.setAttribute("data-theme", choice === "dark" ? "dark" : "light");
  }
}

function currentChoice(): Choice {
  try {
    const stored = localStorage.getItem("sn-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "system";
}

/** Segmented Light / System / Dark. "System" clears the stored choice so
 *  the surface default applies (Field: dark for night shifts). */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [choice, setChoice] = useState<Choice | null>(null);

  useEffect(() => setChoice(currentChoice()), []);

  function pick(next: Choice) {
    applyChoice(next);
    setChoice(next);
  }

  const options: { id: Choice; label: string }[] = [
    { id: "light", label: "Light" },
    { id: "system", label: "Auto" },
    { id: "dark", label: "Dark" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className={`inline-flex rounded-lg border border-line bg-surface p-0.5 ${className}`}
    >
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={choice === o.id}
          onClick={() => pick(o.id)}
          className={`pressable rounded-md px-3 py-1.5 text-caption font-medium ${
            choice === o.id ? "bg-accent text-on-accent" : "text-ink-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Compact icon-only cycle button for tight chrome (Desk sidebar). */
export function ThemeCycleButton({ className = "" }: { className?: string }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  useEffect(() => setChoice(currentChoice()), []);

  function cycle() {
    const order: Choice[] = ["light", "system", "dark"];
    const next = order[(order.indexOf(choice ?? "system") + 1) % order.length];
    applyChoice(next);
    setChoice(next);
  }

  const label = choice === "light" ? "Light" : choice === "dark" ? "Dark" : "Auto";
  const Icon = choice === "light" ? IconSun : choice === "dark" ? IconMoon : IconAuto;
  return (
    <button
      onClick={cycle}
      title={`Appearance: ${label}`}
      aria-label={`Appearance: ${label}. Change appearance`}
      className={`pressable flex items-center justify-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-2 text-caption font-medium text-ink-muted hover:text-ink ${className}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
