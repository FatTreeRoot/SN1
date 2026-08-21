"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

type Cell = { label: string; value: number | null; suppressed: boolean };
type Breakdown = {
  cells: Cell[];
  rollupCell: Cell | null;
  suppressionApplied: boolean;
};
type Report = {
  quarter: string;
  from: string;
  to: string;
  threshold: number;
  totalRecords: number;
  byType: Breakdown;
  byCategory: Breakdown;
  byArea: Breakdown;
  byMonth: { label: string; value: number }[];
  locationsByArea: { area: string; breakdown: Breakdown }[];
  suppressionApplied: boolean;
};

function currentQuarter(): string {
  const now = new Date();
  return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
}

export function ReportBuilder() {
  const [quarter, setQuarter] = useState(currentQuarter());
  const [report, setReport] = useState<Report | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (q: string) => {
    setMessage(null);
    setReport(null);
    const res = await fetch(`/api/desk/reports?quarter=${encodeURIComponent(q)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "The report did not build.");
      return;
    }
    const body = (await res.json()) as { report: Report };
    setReport(body.report);
  }, []);

  useEffect(() => {
    void load(quarter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generatePdf() {
    setBusy(true);
    setGenerated(null);
    const res = await fetch("/api/desk/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quarter }),
    });
    setBusy(false);
    if (res.ok) {
      const body = (await res.json()) as { occurrenceNumber: string };
      setGenerated(body.occurrenceNumber);
    } else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "The PDF did not generate.");
    }
  }

  const table = (title: string, b: Breakdown) => {
    const rows = [...b.cells, ...(b.rollupCell ? [b.rollupCell] : [])];
    return (
      <section key={title} className="flex flex-col gap-2">
        <h2 className="text-h3 font-semibold">{title}</h2>
        {rows.length === 0 ? (
          <p className="text-caption text-ink-muted">No records.</p>
        ) : (
          <table className="w-full max-w-lg border-collapse text-left">
            <tbody>
              {rows.map((c) => (
                <tr key={c.label} className="border-b border-line">
                  <td className={`py-1.5 pr-4 ${c.suppressed ? "text-ink-muted" : ""}`}>
                    {c.label}
                  </td>
                  <td className="py-1.5 text-right font-data">
                    {c.value === null ? (
                      <span className="text-ink-muted">withheld ‡</span>
                    ) : (
                      <>
                        {c.value}
                        {c.suppressed && <span className="text-ink-muted"> ‡</span>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    );
  };

  return (
    <main className="flex max-w-3xl flex-col gap-6 px-8 py-8">
      <PageHeader
        title="Quarterly report"
        subtitle="Built from record metadata only. Small counts are combined or withheld."
        back={{ fallback: "/desk" }}
      />
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-caption text-ink-muted">
            Quarter
            <input
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              placeholder="2026-Q3"
              className="w-28 rounded-md border border-line bg-surface px-2.5 py-1.5 font-data text-body text-ink"
            />
          </label>
          <Button variant="quiet" onClick={() => load(quarter)}>
            Build
          </Button>
          <Button onClick={generatePdf} disabled={busy || !report}>
            {busy ? "Generating…" : "Generate Council PDF"}
          </Button>
        </div>
      </div>

      {message && <p className="text-urgent">{message}</p>}
      {generated && (
        <p className="rounded-lg border border-filed bg-filed-soft px-4 py-3 text-filed">
          Filed to Quarterly Reports as {generated}.
        </p>
      )}

      {report && (
        <>
          <p className="rounded-lg border border-line bg-surface px-4 py-3">
            <span className="font-data text-h3">{report.totalRecords}</span>{" "}
            <span className="text-ink-muted">
              records · {report.from} to {report.to}
            </span>
          </p>
          {table("By record type", report.byType)}
          {table("By category", report.byCategory)}
          {table("By area", report.byArea)}
          {report.locationsByArea.map((l) => table(`Locations — ${l.area}`, l.breakdown))}
          {table("By month", {
            cells: report.byMonth.map((m) => ({ ...m, suppressed: false })),
            rollupCell: null,
            suppressionApplied: false,
          })}
          {report.suppressionApplied && (
            <p className="max-w-lg text-caption text-ink-muted">
              ‡ Values below the suppression threshold ({report.threshold}) are combined or
              withheld to protect privacy in a small community. A withheld value is not zero.
            </p>
          )}
        </>
      )}
    </main>
  );
}
