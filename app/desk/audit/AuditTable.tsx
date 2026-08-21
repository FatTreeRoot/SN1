"use client";

import { useEffect, useState } from "react";

type Entry = {
  id: string;
  at: string;
  actorOid: string;
  action: string;
  surface: string | null;
  recordType: string | null;
  itemId: string | null;
  detail: string | null;
};

/** Append-only audit: who, when, what action, which record — never what
 *  the record says. */
export function AuditTable() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    fetch("/api/desk/audit", { cache: "no-store" })
      .then((r) => {
        if (r.status === 403) {
          setDenied(true);
          return { entries: [] };
        }
        return r.json();
      })
      .then((b: { entries: Entry[] }) => setEntries(b.entries))
      .catch(() => setEntries([]));
  }, []);

  if (denied) {
    return (
      <main className="px-8 py-8 text-ink-muted">
        The audit view needs the manager role.
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-5 px-8 py-8">
      <div>
        <h1 className="text-h2 font-semibold">Audit</h1>
        <p className="text-ink-muted">
          Every submission, read, export, and permission event. Content is never logged.
        </p>
      </div>
      {entries === null && <p className="text-ink-muted">Loading the audit log…</p>}
      {entries !== null && (
        <div className="overflow-x-auto">
          <table className="w-full max-w-5xl border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong text-caption text-ink-muted">
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">Who</th>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2 pr-4">Surface</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-line">
                  <td className="whitespace-nowrap py-2 pr-4 font-data text-caption">
                    {new Date(e.at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{e.actorOid}</td>
                  <td className="py-2 pr-4 font-medium">{e.action}</td>
                  <td className="py-2 pr-4">{e.surface ?? "—"}</td>
                  <td className="py-2 pr-4">{e.recordType ?? "—"}</td>
                  <td className="max-w-md truncate py-2 font-data text-caption text-ink-muted">
                    {e.detail ?? ""}
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
