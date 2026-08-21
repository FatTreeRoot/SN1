"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/StatTile";
import { StatusChip, type RecordStatus } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { rtStrong } from "@/lib/rt-hue";

type Row = {
  itemId: string;
  occurrenceNumber: string;
  recordTypeId: string;
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
  ageMinutes: number;
  alert: boolean;
};

function greeting(): string {
  const h = new Date().getHours();
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function Dashboard({ displayName }: { displayName: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [queues, setQueues] = useState<QueueStatus[]>([]);
  const [paperMode, setPaperMode] = useState(false);

  useEffect(() => {
    const from = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    fetch(`/api/desk/records?from=${from}&to=${to}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { items: Row[] }) => setRows(b.items))
      .catch(() => setRows([]));
    fetch("/api/queue-status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { statuses: [] }))
      .then((b: { statuses: QueueStatus[] }) => setQueues(b.statuses))
      .catch(() => {});
    fetch("/api/paper-mode", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { active: boolean }) => setPaperMode(b.active))
      .catch(() => {});
  }, []);

  const filed = rows?.filter((r) => r.status === "Filed") ?? [];
  const escalations = filed.filter((r) => r.recordTypeId === "RT-ESC");
  const intake = filed.filter((r) => r.recordTypeId === "RT-CCI");
  const alerts = queues.filter((q) => q.alert);
  const recent = (rows ?? []).slice(0, 5);

  return (
    <main className="flex max-w-5xl flex-col gap-6 px-8 py-8">
      <PageHeader
        title={`${greeting()}, ${displayName.split(" ")[0]}`}
        subtitle="The department this week."
        action={
          <Link href="/desk/file">
            <Button>File records</Button>
          </Link>
        }
      />

      {(paperMode || alerts.length > 0 || escalations.length > 0) && (
        <div className="flex flex-col gap-2">
          {paperMode && (
            <Link
              href="/desk/reconcile"
              className="rounded-lg border-l-4 border-pending bg-pending-soft px-4 py-3 font-medium text-pending"
            >
              Paper-only mode is on — reconcile capture cards, or end it from Reconcile.
            </Link>
          )}
          {escalations.length > 0 && (
            <Link
              href="/desk/records"
              className="rounded-lg border-l-4 border-urgent bg-urgent px-4 py-3 font-medium text-on-urgent"
            >
              {escalations.length} escalation{escalations.length === 1 ? "" : "s"} this week —
              review now
            </Link>
          )}
          {alerts.map((q) => (
            <p
              key={q.displayName}
              className="animate-breathe rounded-lg border-l-4 border-pending bg-pending-soft px-4 py-3 font-medium text-pending"
            >
              {q.displayName} has {q.count} {q.count === 1 ? "item" : "items"} not yet filed —
              oldest {Math.round(q.ageMinutes / 60)}h
            </p>
          ))}
        </div>
      )}

      {rows === null ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="rounded-xl border border-line bg-surface p-4">
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile value={filed.length} label="Records this week" />
          <StatTile
            value={escalations.length}
            label="Escalations"
            hue={rtStrong("RT-ESC")}
            hint={escalations.length === 0 ? "None this week" : "Needs eyes"}
          />
          <StatTile
            value={intake.length}
            label="Intake awaiting triage"
            hue={rtStrong("RT-CFS")}
            hint="From the call centre"
          />
          <StatTile
            value={queues.reduce((s, q) => s + q.count, 0)}
            label="Pending on devices"
            hue={rtStrong("RT-FLT")}
            hint={alerts.length > 0 ? `${alerts.length} aging` : "All fresh"}
          />
        </div>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-h3 font-display font-semibold">Recent records</h2>
          <Link href="/desk/records" className="text-caption font-medium text-accent hover:underline">
            All records →
          </Link>
        </div>
        {rows === null ? (
          <SkeletonRows rows={5} />
        ) : recent.length === 0 ? (
          <EmptyState
            title="Nothing filed this week yet"
            body="Records filed from the field and the desk will land here."
            action={
              <Link href="/desk/file">
                <Button variant="quiet">File the first one</Button>
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((r) => (
              <li key={r.itemId}>
                <Link
                  href={`/desk/record?item=${encodeURIComponent(r.itemId)}`}
                  className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 hover:border-line-strong"
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: rtStrong(r.recordTypeId) }}
                  />
                  <OccurrenceNumber value={r.occurrenceNumber} />
                  <span className="min-w-0 flex-1 truncate text-caption text-ink-muted">
                    {r.recordTypeName}
                    {r.categoryName !== "Not applicable" && ` · ${r.categoryName}`} ·{" "}
                    {r.areaName} · {r.authorName}
                  </span>
                  <StatusChip status={r.status.toLowerCase() as RecordStatus} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
