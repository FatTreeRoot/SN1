"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { StatusChip, type RecordStatus } from "@/components/ui/StatusChip";
import { rtStrong } from "@/lib/rt-hue";

type Row = {
  itemId: string;
  recordTypeId: string;
  occurrenceNumber: string;
  recordTypeName: string;
  categoryName: string;
  areaName: string;
  locationName: string;
  recordDate: string;
  status: string;
  submittedByName: string;
  authorName: string;
  sensitivity: string;
};

/** All records, metadata only, filterable. Comfortable working density:
 *  15–20 rows visible, compact filters, calm headers. */
export function RecordsTable({ types }: { types: { id: string; name: string }[] }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [type, setType] = useState("");
  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 86_400_000);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const params = new URLSearchParams({ from, to });
    if (type) params.set("type", type);
    fetch(`/api/desk/records?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { items: Row[] }) => setRows(b.items))
      .catch(() => setRows([]));
  }, [type, from, to]);

  return (
    <main className="flex flex-col gap-5 px-8 py-8">
      <PageHeader title="Records" subtitle="Metadata view. Open a record to read it." />
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-caption text-ink-muted">
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-body text-ink"
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-caption text-ink-muted">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-body text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-caption text-ink-muted">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-body text-ink"
            />
          </label>
        </div>
      </div>

      {rows === null && <SkeletonRows rows={8} />}
      {rows !== null && rows.length === 0 && (
        <EmptyState
          title="No records in this range"
          body="Widen the dates or change the type."
        />
      )}
      {rows !== null && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong text-caption text-ink-muted">
                <th className="py-2 pr-4">Occurrence</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Area</th>
                <th className="py-2 pr-4">Member</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
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
                  <td className="py-2.5 pr-4">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: rtStrong(r.recordTypeId) }}
                      />
                      {r.recordTypeName}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    {r.categoryName === "Not applicable" ? "—" : r.categoryName}
                  </td>
                  <td className="py-2.5 pr-4">{r.areaName}</td>
                  <td className="py-2.5 pr-4">{r.authorName}</td>
                  <td className="py-2.5">
                    <StatusChip status={r.status.toLowerCase() as RecordStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
