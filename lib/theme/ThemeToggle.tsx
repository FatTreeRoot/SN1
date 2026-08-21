"use client";

import { useEffect, useState } from "react";

/**
 * Light/dark toggle. The choice is stored per device; before first paint the
 * root layout's init script applies it (or the surface default) so night
 * shifts never see a white flash.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("sn-theme", next);
    } catch {
      // Private browsing: the choice simply lasts the session
    }
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className={`pressable rounded-md border border-line bg-surface px-3 py-1.5 text-caption text-ink-muted hover:border-line-strong ${className}`}
    >
      {theme === "dark" ? "Switch to light" : "Switch to dark"}
    </button>
  );
}
