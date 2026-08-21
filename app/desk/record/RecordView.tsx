"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { HorizonRule } from "@/components/ui/HorizonRule";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";
import { StatusChip, type RecordStatus } from "@/components/ui/StatusChip";

type Option = { id: string; name: string };

type RecordPayload = {
  metadata: Record<string, string | boolean | undefined> & {
    occurrenceNumber: string;
    recordTypeName: string;
    status: string;
  };
  contentType: string;
  content: string | null;
  contentBase64: string | null;
  versions: { itemId: string; occurrenceNumber: string; status: string; syncedAt: string }[];
};

export function RecordView(props: {
  categories: Option[];
  locations: Option[];
  recordTypes: Option[];
}) {
  return (
    <Suspense>
      <RecordViewInner {...props} />
    </Suspense>
  );
}

function RecordViewInner({
  categories,
  locations,
  recordTypes,
}: {
  categories: Option[];
  locations: Option[];
  recordTypes: Option[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const itemId = params.get("item");
  const [record, setRecord] = useState<RecordPayload | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    fetch(`/api/desk/record?item=${encodeURIComponent(itemId)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "That record could not load.");
        }
        return r.json();
      })
      .then((b: RecordPayload) => setRecord(b))
      .catch((e: Error) => setFailed(e.message));
  }, [itemId]);

  if (!itemId) return <main className="px-8 py-8 text-ink-muted">No record selected.</main>;
  if (failed) return <main className="px-8 py-8 text-ink-muted">{failed}</main>;
  if (!record) return <main className="px-8 py-8 text-ink-muted">Opening the record…</main>;

  const m = record.metadata;
  const metaRows: [string, string | undefined][] = [
    ["Record type", String(m.recordTypeName)],
    ["Category", m.categoryName === "Not applicable" ? "—" : String(m.categoryName)],
    ["Record date", String(m.recordDate)],
    ["Area", String(m.areaName)],
    ["Location", m.locationName === "Not applicable" ? "—" : String(m.locationName)],
    ["Submitted by", String(m.submittedByName)],
    ["Member", String(m.authorName)],
    ["Vehicle", m.vehicleName ? String(m.vehicleName) : "—"],
    ["Sensitivity", String(m.sensitivity)],
    ["Captured", new Date(String(m.capturedAt)).toLocaleString()],
    ["Filed", new Date(String(m.syncedAt)).toLocaleString()],
  ];

  return (
    <main className="flex max-w-4xl flex-col gap-6 px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <OccurrenceNumber value={m.occurrenceNumber} size="large" />
          <StatusChip status={m.status.toLowerCase() as RecordStatus} />
        </div>
        {m.status === "Filed" && (
          <Button variant="quiet" onClick={() => setCorrecting((v) => !v)}>
            {correcting ? "Close correction" : "Correct this record"}
          </Button>
        )}
      </div>

      {Boolean(m.supersedes) && (
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-caption text-ink-muted">
          Corrects {String(m.supersedes)}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-8 gap-y-2.5 rounded-xl border border-line bg-surface p-5 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-3">
          <HorizonRule />
        </div>
        {metaRows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-caption text-ink-muted">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="text-h3 font-semibold">Narrative</h2>
        {record.content ? (
          <pre className="whitespace-pre-wrap rounded-lg border border-line bg-surface p-5 font-body text-body">
            {record.content}
          </pre>
        ) : (
          <p className="rounded-lg border border-line bg-surface p-5 text-ink-muted">
            Binary content ({record.contentType}). Download support arrives with the Graph
            adapter — in SharePoint this opens natively.
          </p>
        )}
      </section>

      {record.versions.length > 1 && (
        <Disclosure title="Versions" summary={`${record.versions.length} versions`} defaultOpen>
          <ul className="flex flex-col gap-2">
            {record.versions.map((v) => (
              <li key={v.itemId} className="flex items-center justify-between gap-3">
                <a
                  href={`/desk/record?item=${encodeURIComponent(v.itemId)}`}
                  className="text-accent underline-offset-4 hover:underline"
                >
                  <OccurrenceNumber value={v.occurrenceNumber} />
                </a>
                <span className="text-caption text-ink-muted">
                  {new Date(v.syncedAt).toLocaleString()}
                </span>
                <StatusChip status={v.status.toLowerCase() as RecordStatus} />
              </li>
            ))}
          </ul>
        </Disclosure>
      )}

      {correcting && (
        <CorrectionForm
          itemId={itemId}
          categories={categories}
          locations={locations}
          recordTypes={recordTypes}
          onDone={(newItemId) => {
            router.push(`/desk/record?item=${encodeURIComponent(newItemId)}`);
            router.refresh();
            setCorrecting(false);
            setRecord(null);
          }}
        />
      )}
    </main>
  );
}

/** Correction: supersedes, never edits. Change what needs changing;
 *  everything left blank carries over. */
function CorrectionForm({
  itemId,
  categories,
  locations,
  recordTypes,
  onDone,
}: {
  itemId: string;
  categories: Option[];
  locations: Option[];
  recordTypes: Option[];
  onDone: (newItemId: string) => void;
}) {
  const [recordTypeId, setRecordTypeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.set("originalItemId", itemId);
    form.set("idempotencyKey", crypto.randomUUID());
    if (recordTypeId) form.set("recordTypeId", recordTypeId);
    if (categoryId) form.set("categoryId", categoryId);
    if (locationId) form.set("locationId", locationId);
    if (note.trim()) form.set("note", note.trim());

    const res = await fetch("/api/desk/correct", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "The correction did not file.");
      return;
    }
    const body = (await res.json()) as { itemId: string };
    onDone(body.itemId);
  }

  const select = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: Option[],
  ) => (
    <label className="flex flex-col gap-1 text-caption text-ink-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-line bg-raised px-2.5 py-1.5 text-body text-ink"
      >
        <option value="">Keep as is</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-accent bg-accent-soft/40 p-5">
      <h2 className="text-h3 font-semibold">Correction</h2>
      <p className="text-caption text-ink-muted">
        This files a new version and marks the current one superseded. Nothing is edited in
        place or deleted.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {select("Record type", recordTypeId, setRecordTypeId, recordTypes)}
        {select("Category", categoryId, setCategoryId, categories)}
        {select("Location", locationId, setLocationId, locations)}
      </div>
      <label className="flex flex-col gap-1 text-caption text-ink-muted">
        Corrected narrative (leave blank to keep the original content)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="rounded-md border border-line bg-raised px-3 py-2 text-body text-ink"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Filing…" : "File the correction"}
        </Button>
        {message && <p className="text-caption text-urgent">{message}</p>}
      </div>
    </section>
  );
}
