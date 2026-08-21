"use client";

import { useRouter } from "next/navigation";
import { IconBack } from "@/components/icons";

/**
 * Return to the previous screen. Uses browser history when there is one
 * (so it goes back to wherever the person actually came from) and falls
 * back to a sensible home when a page was opened directly — a link that
 * dead-ends is worse than no link.
 */
export function BackButton({
  fallback = "/",
  label = "Back",
  className = "",
}: {
  fallback?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      onClick={goBack}
      className={`pressable -ml-1 flex min-h-11 items-center gap-1.5 self-start rounded-lg px-2 py-1.5 font-medium text-ink-muted hover:text-ink ${className}`}
    >
      <IconBack className="h-5 w-5" />
      {label}
    </button>
  );
}
