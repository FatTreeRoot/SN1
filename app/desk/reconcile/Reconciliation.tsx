"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";

type Option = { id: string; name: string };
type Filed = { tempRef: string; occurrence: string };

/**
 * Card-by-card transcription in the same order as the capture card. File in
 * date order — the form keeps the last date and member to speed a stack of
 * cards from one shift. Paper-only mode toggles from here too.
 */
export function Reconciliation({
  members,
  recordTypes,
  categories,
  locations,
}: {
  members: { oid: string; name: string }[];
  recordTypes: Option[];
  categories: Option[];
  locations: Option[];
}) {
  const [authorOid, setAuthorOid] = useState(members[0]?.oid ?? "");
  const [recordTypeId, setRecordTypeId] = useState(recordTypes[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tempRef, setTempRef] = useState("");
  const [preIssued, setPreIssued] = useState("");
  const [narrative, setNarrative] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [filed, setFiled] = useState<Filed[]>([]);
  const [paperMode, setPaperMode] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/paper-mode", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { active: boolean }) => setPaperMode(b.active))
      .catch(() => setPaperMode(false));
  }, []);

  async function togglePaperMode() {
    const res = await fetch("/api/paper-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !paperMode }),
    });
    if (res.ok) setPaperMode((v) => !v);
  }

  async function fileCard() {
    if (!narrative.trim()) {
      setMessage("The card's narrative is required.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/desk/reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorOid,
        recordTypeId,
        categoryId: categoryId || undefined,
        locationId: locationId || undefined,
        recordDate,
        narrative: narrative.trim(),
        tempRef: tempRef || undefined,
        preIssuedOccurrence: preIssued || undefined,
        idempotencyKey: crypto.randomUUID(),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "That card did not file.");
      return;
    }
    const body = (await res.json()) as { occurrenceNumber: string };
    setFiled((prev) => [...prev, { tempRef: tempRef || "—", occurrence: body.occurrenceNumber }]);
    // Keep member, type, and date for the next card in the stack
    setCategoryId("");
    setLocationId("");
    setTempRef("");
    setPreIssued("");
    setNarrative("");
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
    <main className="flex max-w-3xl flex-col gap-6 px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h2 font-semibold">Reconciliation</h1>
          <p className="text-ink-muted">
            File from Field Capture Cards, oldest first. Same order as the card.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/desk/capture-card" download>
            <Button variant="quiet">Print capture cards</Button>
          </a>
          {paperMode !== null && (
            <Button variant={paperMode ? "destructive" : "quiet"} onClick={togglePaperMode}>
              {paperMode ? "End paper only" : "Declare paper only"}
            </Button>
          )}
        </div>
      </div>

      {paperMode && (
        <p className="rounded-lg border border-pending bg-pending-soft px-4 py-3 font-medium text-pending">
          Paper only is on — every signed-in user sees the banner and end of shift routes
          to the filing sheet.
        </p>
      )}

      <div className="grid gap-3 rounded-lg border border-line bg-surface p-5 sm:grid-cols-3">
        {select("Member (from the card)", authorOid, setAuthorOid, members.map((m) => ({ id: m.oid, name: m.name })), true)}
        {select("Record type", recordTypeId, setRecordTypeId, recordTypes, true)}
        {select("Category", categoryId, setCategoryId, categories)}
        {select("Location", locationId, setLocationId, locations)}
        <label className="flex flex-col gap-1 text-caption text-ink-muted">
          Date it happened
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            className="rounded-md border border-line bg-raised px-2.5 py-1.5 text-body text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-caption text-ink-muted">
          Temp ref (from the card)
          <input
            value={tempRef}
            onChange={(e) => setTempRef(e.target.value)}
            placeholder="T-01"
            className="rounded-md border border-line bg-raised px-2.5 py-1.5 font-data text-body text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-caption text-ink-muted sm:col-span-2">
          Pre-issued occurrence number, if written on the card
          <input
            value={preIssued}
            onChange={(e) => setPreIssued(e.target.value)}
            placeholder="PS-2026-0820-0006"
            className="rounded-md border border-line bg-raised px-2.5 py-1.5 font-data text-body text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-caption text-ink-muted sm:col-span-3">
          Narrative, transcribed exactly
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={4}
            className="rounded-md border border-line bg-raised px-3 py-2 text-body text-ink"
          />
        </label>
        <div className="flex items-center gap-3 sm:col-span-3">
          <Button onClick={fileCard} disabled={busy}>
            {busy ? "Filing…" : "File this card"}
          </Button>
          {message && <p className="text-caption text-urgent">{message}</p>}
        </div>
      </div>

      {filed.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-h3 font-semibold">Reconciled this session</h2>
          <table className="w-full max-w-md border-collapse text-left">
            <thead>
              <tr className="border-b border-line-strong text-caption text-ink-muted">
                <th className="py-1.5 pr-4">Temp ref</th>
                <th className="py-1.5">Occurrence</th>
              </tr>
            </thead>
            <tbody>
              {filed.map((f, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-2 pr-4 font-data">{f.tempRef}</td>
                  <td className="py-2">
                    <OccurrenceNumber value={f.occurrence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
