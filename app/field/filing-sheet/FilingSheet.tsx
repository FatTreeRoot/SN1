"use client";

import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { t } from "@/config/strings";
import { usePendingQueue } from "@/lib/queue";

/**
 * The paper fallback, built into the product: a printable list of items
 * not yet filed, each with a temporary reference a supervisor can reconcile
 * against the issued occurrence number later.
 */
export function FilingSheet({ displayName }: { displayName: string }) {
  const { items } = usePendingQueue();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6 print:max-w-none">
      <div className="flex flex-col gap-3 print:hidden">
        <BackButton fallback="/field/end" />
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-h2 font-display font-semibold">{t("filingSheet")}</h1>
          <Button variant="quiet" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-4 print:border-black">
        <p className="font-medium">Shift filing sheet — {displayName}</p>
        <p className="text-caption text-ink-muted">
          Printed {new Date().toLocaleString()} · {items.length} outstanding
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-ink-muted">Nothing outstanding. Everything is filed.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line-strong text-caption text-ink-muted">
              <th className="py-2 pr-3">Temp ref</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Captured</th>
              <th className="py-2">Occurrence (office use)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} className="border-b border-line align-top">
                <td className="py-2.5 pr-3 font-data">
                  T-{String(i + 1).padStart(2, "0")}
                </td>
                <td className="py-2.5 pr-3">{item.recordTypeId.replace("RT-", "")}</td>
                <td className="py-2.5 pr-3 text-caption">
                  {new Date(item.capturedAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-2.5 font-data text-ink-muted">PS-________-______</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
