import type { ReactNode } from "react";
import { BackButton } from "./BackButton";
import { HorizonRule } from "./HorizonRule";

/** Consistent page identity: a way back, the horizon motif, title, quiet
 *  subtitle, and an action slot on the right. */
export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Show a back link above the title; pass a fallback for direct opens. */
  back?: { fallback: string; label?: string };
}) {
  return (
    <div className="flex flex-col gap-3">
      {back && <BackButton fallback={back.fallback} label={back.label} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <HorizonRule />
          <h1 className="text-h2 font-display font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="text-ink-muted">{subtitle}</p>}
        </div>
        {action && <div className="flex items-end gap-2">{action}</div>}
      </div>
    </div>
  );
}
