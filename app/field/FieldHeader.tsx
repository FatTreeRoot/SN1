"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { PendingBanner } from "@/components/ui/PendingBanner";
import { usePendingQueue } from "@/lib/queue";

/**
 * Quiet header strip: brand, shift context, and the pending banner —
 * the one loud element, by design. The horizon settles into this strip
 * after sign-in; it stays a thin echo of the sign-on screen.
 */
export function FieldHeader({
  displayName,
  shift,
}: {
  displayName: string;
  shift: {
    vehicleName: string;
    areaName: string;
    partnerName: string | null;
    startedAt: string;
  } | null;
}) {
  const { count } = usePendingQueue();
  const pathname = usePathname();
  const onShiftScreen = pathname === "/field/shift";

  return (
    <header className="sticky top-0 z-20">
      {/* The Nation's red rule — brand chrome, as on squamish.net */}
      <div aria-hidden className="h-1 bg-accent" />
      <div className="border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/field" className="flex items-center gap-2.5">
            <BrandMark variant="compact" className="w-8" />
            <span className="font-display font-semibold">SN Connect</span>
          </Link>
          {shift && !onShiftScreen && (
            <span className="truncate text-caption text-ink-muted">
              {displayName.split(" ")[0]} · {shift.vehicleName} · {shift.areaName}
            </span>
          )}
        </div>
      </div>
      {!onShiftScreen && <PendingBanner count={count} />}
    </header>
  );
}
