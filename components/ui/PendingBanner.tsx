import { t } from "@/config/strings";

/**
 * The pending state is never a subtle badge: a full-width coloured bar,
 * breathing slowly in ochre. Patient, not alarming — and visible from
 * arm's length on a dashboard mount.
 * Under reduced motion the breathing stops and a heavier left border
 * carries the state instead (see globals.css).
 */
export function PendingBanner({ count }: { count: number }) {
  if (count === 0) return null;
  const message = count === 1 ? t("pendingOne") : t("pendingMany", { count });
  return (
    <div
      role="status"
      className="animate-breathe w-full border-l-4 border-pending bg-pending-soft px-4 py-3 font-medium text-pending"
    >
      {message}
    </div>
  );
}
