"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { StatusChip, type RecordStatus } from "@/components/ui/StatusChip";
import { t } from "@/config/strings";
import { usePendingQueue } from "@/lib/queue";

type Item = {
  itemId: string;
  occurrenceNumber: string;
  recordTypeName: string;
  categoryName: string;
  areaName: string;
  recordDate: string;
  status: string;
};

/** Filed items come live from storage metadata on each load; queued items
 *  come from the device and stay visible until the server confirms. */
export function SubmissionsList() {
  const { items: queued } = usePendingQueue();
  const [filed, setFiled] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/submissions", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((body: { items: Item[] }) => {
        if (!cancelled) setFiled(body.items);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [queued.length]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-6">
      <PageHeader title={t("mySubmissions")} subtitle="Last 30 days, read live." back={{ fallback: "/field" }} />

      {queued.length > 0 && (
        <ul className="flex flex-col gap-2">
          {queued.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-pending bg-pending-soft px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{q.recordTypeId.replace("RT-", "")}</p>
                <p className="text-caption text-ink-muted">
                  Captured {new Date(q.capturedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <StatusChip status="pending" />
            </li>
          ))}
        </ul>
      )}

      {filed === null && !failed && <SkeletonRows rows={4} />}
      {failed && (
        <p className="rounded-lg border border-line bg-surface px-4 py-3 text-ink-muted">
          Your filed items could not load right now. They are safe — pull back in signal
          and reopen this screen.
        </p>
      )}
      {filed !== null && filed.length === 0 && queued.length === 0 && (
        <EmptyState title="Nothing filed yet" body={t("mySubmissionsEmpty")} />
      )}
      {filed !== null && filed.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filed.map((item) => (
            <li
              key={item.itemId}
              className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <OccurrenceNumber value={item.occurrenceNumber} />
                <StatusChip
                  status={(item.status.toLowerCase() as RecordStatus) ?? "filed"}
                />
              </div>
              <p className="text-caption text-ink-muted">
                {item.recordTypeName}
                {item.categoryName !== "Not applicable" && ` · ${item.categoryName}`} ·{" "}
                {item.areaName} · {item.recordDate}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
