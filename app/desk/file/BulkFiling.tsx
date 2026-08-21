"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";

type Option = { id: string; name: string };
type FileRow = {
  file: File;
  state: "ready" | "filing" | "filed" | "failed";
  occurrence?: string;
  error?: string;
};

/**
 * Drag files in, set the metadata once, file the batch. Each file files
 * individually — one failure never blocks the rest — and each gets its own
 * occurrence number. Community emails file here with type Community email.
 */
export function BulkFiling({
  recordTypes,
  categories,
  locations,
}: {
  recordTypes: Option[];
  categories: Option[];
  locations: Option[];
}) {
  const [rows, setRows] = useState<FileRow[]>([]);
  const [recordTypeId, setRecordTypeId] = useState(recordTypes[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setRows((prev) => [
      ...prev,
      ...[...list].map((file) => ({ file, state: "ready" as const })),
    ]);
  }

  async function fileAll() {
    setBusy(true);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].state === "filed" || rows[i].state === "filing") continue;
      setRows((prev) => prev.map((r, j) => (j === i ? { ...r, state: "filing" } : r)));
      const form = new FormData();
      form.set("recordTypeId", recordTypeId);
      if (categoryId) form.set("categoryId", categoryId);
      if (locationId) form.set("locationId", locationId);
      form.set("recordDate", recordDate);
      form.set("capturedAt", new Date().toISOString());
      form.set("idempotencyKey", crypto.randomUUID());
      form.set("file", rows[i].file);
      try {
        const res = await fetch("/api/submissions", { method: "POST", body: form });
        if (res.ok) {
          const body = (await res.json()) as { occurrenceNumber: string };
          setRows((prev) =>
            prev.map((r, j) =>
              j === i ? { ...r, state: "filed", occurrence: body.occurrenceNumber } : r,
            ),
          );
        } else {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setRows((prev) =>
            prev.map((r, j) =>
              j === i ? { ...r, state: "failed", error: body?.error ?? "Did not file" } : r,
            ),
          );
        }
      } catch {
        setRows((prev) =>
          prev.map((r, j) =>
            j === i ? { ...r, state: "failed", error: "No connection — try again" } : r,
          ),
        );
      }
    }
    setBusy(false);
  }

  const select = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: Option[],
    required = false,
  ) => (
    <label className="flex flex-col gap-1 text-caption text-ink-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-body text-ink"
      >
        {!required && <option value="">—</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <main className="flex max-w-4xl flex-col gap-6 px-8 py-8">
      <div>
        <h1 className="text-h2 font-semibold">File</h1>
        <p className="text-ink-muted">
          Drop files, set the details once, file the batch. Community emails file here too.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Add files"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-6 text-center ${
          dragOver ? "border-accent bg-accent-soft/40" : "border-line bg-surface"
        }`}
      >
        <p className="text-ink-muted">
          Drop files here, or click to choose. Each file becomes its own record.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {select("Record type", recordTypeId, setRecordTypeId, recordTypes, true)}
        {select("Category", categoryId, setCategoryId, categories)}
        {select("Location", locationId, setLocationId, locations)}
        <label className="flex flex-col gap-1 text-caption text-ink-muted">
          Record date
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-body text-ink"
          />
        </label>
      </div>

      {rows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <li
              key={`${r.file.name}-${i}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-2.5"
              style={{ ["--sn-stagger" as string]: `${i * 60}ms` }}
            >
              <span className="min-w-0 truncate font-medium">{r.file.name}</span>
              <span className="shrink-0 text-caption">
                {r.state === "ready" && <span className="text-ink-muted">Ready</span>}
                {r.state === "filing" && <span className="text-ink-muted">Filing…</span>}
                {r.state === "filed" && r.occurrence && (
                  <span className="animate-checkoff text-filed">
                    <OccurrenceNumber value={r.occurrence} /> · Filed
                  </span>
                )}
                {r.state === "failed" && <span className="text-urgent">{r.error}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Button onClick={fileAll} disabled={busy || rows.length === 0}>
          {busy ? "Filing…" : `File ${rows.filter((r) => r.state !== "filed").length} items`}
        </Button>
      </div>
    </main>
  );
}
