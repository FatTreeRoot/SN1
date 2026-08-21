"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Disclosure } from "@/components/ui/Disclosure";
import { EmptyState } from "@/components/ui/EmptyState";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { StatusChip, type RecordStatus } from "@/components/ui/StatusChip";

type Row = {
  itemId: string;
  occurrenceNumber: string;
  recordTypeName: string;
  categoryName: string;
  areaName: string;
  recordDate: string;
  status: string;
  authorName: string;
  syncedAt: string;
};

type QueueStatus = {
  displayName: string;
  count: number;
  oldestQueuedAt: string | null;
  ageMinutes: number;
  alert: boolean;
  reportedAt: string;
};

/** The last seven days by member, with device queue alerts on top so an
 *  aging pending queue is the supervisor's problem too, not only the
 *  patroller's. */
export function ReviewPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [queues, setQueues] = useState<QueueStatus[]>([]);
  const [warnMinutes, setWarnMinutes] = useState(120);

  useEffect(() => {
    const from = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    fetch(`/api/desk/records?from=${from}&to=${to}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { items: Row[] }) => setRows(b.items))
      .catch(() => setRows([]));
    fetch("/api/queue-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { statuses: QueueStatus[]; warnMinutes: number }) => {
        setQueues(b.statuses);
        setWarnMinutes(b.warnMinutes);
      })
      .catch(() => {});
  }, []);

  const alerts = queues.filter((q) => q.alert);
  const byMember = new Map<string, Row[]>();
  for (const r of rows ?? []) {
    byMember.set(r.authorName, [...(byMember.get(r.authorName) ?? []), r]);
  }

  return (
    <main className="flex max-w-4xl flex-col gap-6 px-8 py-8">
      <PageHeader title="Review" subtitle="Team submissions, last seven days." />

      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.map((q) => (
            <p
              key={q.displayName}
              className="animate-breathe rounded-lg border-l-4 border-pending bg-pending-soft px-4 py-3 font-medium text-pending"
            >
              {q.displayName} has {q.count} {q.count === 1 ? "item" : "items"} not yet filed —
              oldest {Math.round(q.ageMinutes / 60)}h (threshold {Math.round(warnMinutes / 60)}h)
            </p>
          ))}
        </div>
      )}

      {rows === null && <SkeletonRows rows={5} />}
      {rows !== null && byMember.size === 0 && (
        <EmptyState
          title="Nothing filed this week yet"
          body="Team submissions land here as shifts file them."
        />
      )}
      <div className="flex flex-col gap-2">
        {[...byMember.entries()].map(([member, items]) => (
          <Disclosure
            key={member}
            title={
              <span className="flex items-center gap-2.5">
                <Avatar name={member} />
                {member}
              </span>
            }
            summary={`${items.length} filed`}
            defaultOpen={byMember.size <= 2}
          >
            <ul className="flex flex-col gap-2">
              {items.map((r) => (
                <li key={r.itemId} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/desk/record?item=${encodeURIComponent(r.itemId)}`}
                    className="text-accent underline-offset-4 hover:underline"
                  >
                    <OccurrenceNumber value={r.occurrenceNumber} />
                  </Link>
                  <span className="min-w-0 flex-1 truncate text-caption text-ink-muted">
                    {r.recordTypeName}
                    {r.categoryName !== "Not applicable" && ` · ${r.categoryName}`} ·{" "}
                    {r.areaName} · {r.recordDate}
                  </span>
                  <StatusChip status={r.status.toLowerCase() as RecordStatus} />
                </li>
              ))}
            </ul>
          </Disclosure>
        ))}
      </div>
    </main>
  );
}
