import type { ReactNode } from "react";

/** An empty screen invites an action. The illustration is the horizon —
 *  geometric landscape only. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <svg aria-hidden viewBox="0 0 120 48" className="w-28 opacity-80">
        <rect x="0" y="18" width="120" height="7" rx="3.5" fill="var(--sn-accent)" opacity="0.85" />
        <rect x="10" y="29" width="110" height="5" rx="2.5" fill="var(--sn-water)" opacity="0.8" />
        <rect x="22" y="38" width="98" height="4" rx="2" fill="var(--sn-pending)" opacity="0.7" />
      </svg>
      <div>
        <p className="font-display text-h3 font-medium">{title}</p>
        {body && <p className="mt-1 max-w-sm text-ink-muted">{body}</p>}
      </div>
      {action}
    </div>
  );
}
