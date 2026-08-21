"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { PageHeader } from "@/components/ui/PageHeader";

type Vocab = {
  recordTypes: {
    id: string;
    name: string;
    enabled: boolean;
    routing: string;
    sensitivityDefault: string;
  }[];
  categories: { id: string; name: string }[];
  locations: { id: string; name: string; areaId: string }[];
  vehicles: { id: string; name: string }[];
};

/**
 * Configuration, visible and honest: what is provisional says so, what
 * routes where is inspectable, and the two operational thresholds are
 * editable here. Vocabulary editing lands with the client workshop output;
 * until then the seed is displayed with its provenance.
 */
export function AdminPanel({
  provisional,
  vocab,
  routing,
  excel,
}: {
  provisional: boolean;
  vocab: Vocab;
  routing: { key: string; site: string; library: string }[];
  excel: { tableName: string; workbookPath: string; columns: Record<string, string> };
}) {
  const [settings, setSettings] = useState<{
    suppressionThreshold: number;
    queueAgeWarnMinutes: number;
  } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { settings: { suppressionThreshold: number; queueAgeWarnMinutes: number } }) =>
        setSettings(b.settings),
      )
      .catch(() => {});
  }, []);

  async function save() {
    if (!settings) return;
    await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="flex max-w-4xl flex-col gap-6 px-8 py-8">
      <PageHeader
        title="Admin"
        subtitle="Vocabularies, routing, thresholds, Excel mapping."
      />

      {provisional && (
        <p className="rounded-lg border border-pending bg-pending-soft px-4 py-3 font-medium text-pending">
          Vocabularies are provisional — a working set pending the category workshop with
          the department. Editing opens up once the confirmed list is seeded.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Disclosure title="Thresholds" summary="Suppression · queue age" defaultOpen>
          {settings ? (
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex flex-col gap-1 text-caption text-ink-muted">
                Small-cell suppression threshold
                <input
                  type="number"
                  min={2}
                  value={settings.suppressionThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, suppressionThreshold: Number(e.target.value) })
                  }
                  className="w-28 rounded-md border border-line bg-raised px-2.5 py-1.5 text-body text-ink"
                />
              </label>
              <label className="flex flex-col gap-1 text-caption text-ink-muted">
                Queue age alert (minutes)
                <input
                  type="number"
                  min={15}
                  value={settings.queueAgeWarnMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, queueAgeWarnMinutes: Number(e.target.value) })
                  }
                  className="w-28 rounded-md border border-line bg-raised px-2.5 py-1.5 text-body text-ink"
                />
              </label>
              <Button onClick={save}>{saved ? "Saved" : "Save"}</Button>
            </div>
          ) : (
            <p className="text-ink-muted">Loading settings…</p>
          )}
          <p className="mt-2 text-caption text-ink-muted">
            Report counts below the suppression threshold are withheld or rolled up, and the
            report says so. Queue age past the alert threshold notifies supervisors.
          </p>
        </Disclosure>

        <Disclosure title="Record types" summary={`${vocab.recordTypes.length} defined`}>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong text-caption text-ink-muted">
                <th className="py-1.5 pr-4">Name</th>
                <th className="py-1.5 pr-4">Routes to</th>
                <th className="py-1.5 pr-4">Default sensitivity</th>
                <th className="py-1.5">State</th>
              </tr>
            </thead>
            <tbody>
              {vocab.recordTypes.map((rt) => (
                <tr key={rt.id} className="border-b border-line">
                  <td className="py-2 pr-4 font-medium">{rt.name}</td>
                  <td className="py-2 pr-4 font-data text-caption">{rt.routing}</td>
                  <td className="py-2 pr-4">{rt.sensitivityDefault}</td>
                  <td className="py-2">
                    {rt.enabled ? (
                      "Enabled"
                    ) : (
                      <span className="text-ink-muted">Disabled (pending review)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Disclosure>

        <Disclosure title="Categories" summary={`${vocab.categories.length} (provisional)`}>
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {vocab.categories.map((c) => (
              <li key={c.id} className="rounded-md border border-line bg-raised px-3 py-1.5">
                {c.name} <span className="font-data text-caption text-ink-muted">{c.id}</span>
              </li>
            ))}
          </ul>
        </Disclosure>

        <Disclosure title="Locations" summary={`${vocab.locations.length} defined`}>
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {vocab.locations.map((l) => (
              <li key={l.id} className="rounded-md border border-line bg-raised px-3 py-1.5">
                {l.name} <span className="font-data text-caption text-ink-muted">{l.id}</span>
              </li>
            ))}
          </ul>
        </Disclosure>

        <Disclosure title="Storage routing" summary={`${routing.length} libraries`}>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong text-caption text-ink-muted">
                <th className="py-1.5 pr-4">Routing key</th>
                <th className="py-1.5 pr-4">Site</th>
                <th className="py-1.5">Library</th>
              </tr>
            </thead>
            <tbody>
              {routing.map((r) => (
                <tr key={r.key} className="border-b border-line">
                  <td className="py-2 pr-4 font-data text-caption">{r.key}</td>
                  <td className="py-2 pr-4">{r.site}</td>
                  <td className="py-2">{r.library}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-caption text-ink-muted">
            Site URLs and library names live in config/storage-map.ts — the file to edit
            when IT provisions the real sites.
          </p>
        </Disclosure>

        <Disclosure title="Excel tracker mapping" summary={excel.tableName}>
          <p className="mb-2 text-caption text-ink-muted">
            Table “{excel.tableName}” · {excel.workbookPath}
          </p>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong text-caption text-ink-muted">
                <th className="py-1.5 pr-4">Field</th>
                <th className="py-1.5">Tracker column</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(excel.columns).map(([field, col]) => (
                <tr key={field} className="border-b border-line">
                  <td className="py-2 pr-4 font-data text-caption">{field}</td>
                  <td className="py-2">{col}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-caption text-ink-muted">
            Mapping lives in config/columns.json — a new tracker column is a settings
            change, not code. Headers are validated on every append; drift raises an alert.
          </p>
        </Disclosure>
      </div>
    </main>
  );
}
