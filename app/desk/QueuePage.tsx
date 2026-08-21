"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { StatusChip } from "@/components/ui/StatusChip";

type Row = {
  itemId: string;
  occurrenceNumber: string;
  recordTypeId: string;
  recordTypeName: string;
  areaName: string;
  recordDate: string;
  status: string;
  syncedAt: string;
};

/** Automated intake awaiting triage, oldest first, with age visible. */
export function QueuePage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/api/desk/records?type=RT-CCI", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { items: Row[] }) =>
        setRows(
          b.items
            .filter((i) => i.status === "Filed")
            .sort((a, z) => a.syncedAt.localeCompare(z.syncedAt)),
        ),
      )
      .catch(() => setRows([]));
  }, []);

  return (
    <main className="flex flex-col gap-5 px-8 py-8">
      <PageHeader title="Queue" subtitle="Call centre intake awaiting triage." back={{ fallback: "/desk" }} />

      {rows === null && <SkeletonRows rows={4} />}
      {rows !== null && rows.length === 0 && (
        <EmptyState
          title="The queue is clear"
          body="New intake from the call centre appears here as it arrives."
        />
      )}
      {rows !== null && rows.length > 0 && (
        <table className="w-full max-w-4xl border-collapse text-left">
          <thead>
            <tr className="border-b border-line-strong text-caption text-ink-muted">
              <th className="py-2 pr-4">Occurrence</th>
              <th className="py-2 pr-4">Received</th>
              <th className="py-2 pr-4">Area</th>
              <th className="py-2 pr-4">Age</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const ageHours = Math.round(
                (Date.now() - new Date(r.syncedAt).getTime()) / 3_600_000,
              );
              return (
                <tr key={r.itemId} className="border-b border-line hover:bg-surface">
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/desk/record?item=${encodeURIComponent(r.itemId)}`}
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      <OccurrenceNumber value={r.occurrenceNumber} />
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4">{r.recordDate}</td>
                  <td className="py-2.5 pr-4">{r.areaName}</td>
                  <td className={`py-2.5 pr-4 ${ageHours > 24 ? "font-medium text-pending" : ""}`}>
                    {ageHours < 1 ? "<1 h" : `${ageHours} h`}
                  </td>
                  <td className="py-2.5">
                    <StatusChip status="pending" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
