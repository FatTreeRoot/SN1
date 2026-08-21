"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { StatusChip, type RecordStatus } from "@/components/ui/StatusChip";

type Item = {
  itemId: string;
  occurrenceNumber: string;
  recordTypeName: string;
  categoryName: string;
  areaName: string;
  recordDate: string;
  status: string;
};

export function DeskSubmissions() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    fetch("/api/submissions", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { items: Item[] }) => setItems(b.items))
      .catch(() => setItems([]));
  }, []);

  return (
    <main className="flex max-w-4xl flex-col gap-5 px-8 py-8">
      <PageHeader title="My submissions" subtitle="Last 30 days, read live." />
      {items === null && <SkeletonRows rows={6} />}
      {items !== null && items.length === 0 && (
        <EmptyState
          title="Nothing filed yet"
          body="Reports you file — from here or your phone — show up in this list."
        />
      )}
      {items !== null && items.length > 0 && (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line-strong text-caption text-ink-muted">
              <th className="py-2 pr-4">Occurrence</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Area</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.itemId} className="border-b border-line hover:bg-surface">
                <td className="py-2.5 pr-4">
                  <OccurrenceNumber value={r.occurrenceNumber} />
                </td>
                <td className="py-2.5 pr-4">{r.recordDate}</td>
                <td className="py-2.5 pr-4">{r.recordTypeName}</td>
                <td className="py-2.5 pr-4">
                  {r.categoryName === "Not applicable" ? "—" : r.categoryName}
                </td>
                <td className="py-2.5 pr-4">{r.areaName}</td>
                <td className="py-2.5">
                  <StatusChip status={r.status.toLowerCase() as RecordStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
