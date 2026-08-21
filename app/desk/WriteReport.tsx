"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconCamera } from "@/components/icons";
import { rtStrong } from "@/lib/rt-hue";

type Option = { id: string; name: string };
type LocationOption = Option & { areaId: string };

const MAX_PHOTOS = 5;

/**
 * The desktop report desk: details on the left, a roomy narrative and the
 * photo strip on the right. Files through the same endpoint as the phone;
 * the server composes the formatted PDF and files it where it belongs.
 */
export function WriteReport({
  recordTypes,
  categories,
  locations,
  showBack = false,
}: {
  recordTypes: Option[];
  categories: Option[];
  locations: LocationOption[];
  /** True at /desk/write, where this is a page you navigated into.
   *  Patrollers see it as their home, which has nothing to go back to. */
  showBack?: boolean;
}) {
  const [recordTypeId, setRecordTypeId] = useState(recordTypes[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [recordDate, setRecordDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [filed, setFiled] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const needsCategory = ["RT-CFS", "RT-ESC"].includes(recordTypeId);

  function addPhotos(list: FileList | null) {
    if (!list) return;
    setPhotos((prev) => {
      const next = [...prev];
      for (const f of list) {
        if (next.length >= MAX_PHOTOS) break;
        if (f.type === "image/jpeg" || f.type === "image/png") next.push(f);
      }
      return next;
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function fileIt() {
    if (photos.length === 0 && !note.trim()) {
      setMessage("Add a photo or write the report, then file it.");
      return;
    }
    if (!locationId) {
      setMessage("Pick a location so the report files to the right area.");
      return;
    }
    setBusy(true);
    setMessage(null);

    const form = new FormData();
    form.set("recordTypeId", recordTypeId);
    if (needsCategory && categoryId) form.set("categoryId", categoryId);
    form.set("locationId", locationId);
    form.set("recordDate", recordDate);
    form.set("capturedAt", new Date().toISOString());
    form.set("idempotencyKey", crypto.randomUUID());
    if (note.trim()) form.set("note", note.trim());
    for (const photo of photos) form.append("photo", photo);

    const res = await fetch("/api/submissions", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "The report did not file. Try again.");
      return;
    }
    const body = (await res.json()) as { occurrenceNumber: string };
    setFiled(body.occurrenceNumber);
    setNote("");
    setPhotos([]);
    setCategoryId("");
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
        className="rounded-md border border-line bg-raised px-2.5 py-2 text-body text-ink"
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
    <main className="flex max-w-5xl flex-col gap-6 px-8 py-8">
      <PageHeader
        title="Write report"
        subtitle="Filed as a formatted PDF, stamped with its occurrence number, in the right place."
        back={showBack ? { fallback: "/desk" } : undefined}
      />

      {filed && (
        <div className="animate-lift flex items-center gap-4 rounded-xl border border-filed bg-filed-soft px-5 py-4">
          <div>
            <p className="font-medium text-filed">Filed</p>
            <OccurrenceNumber value={filed} size="large" />
          </div>
          <p className="text-ink-muted">The next report starts fresh below.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex h-fit flex-col gap-4 rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="h-6 w-1.5 rounded-full"
              style={{ backgroundColor: rtStrong(recordTypeId) }}
            />
            <span className="font-display font-semibold">Details</span>
          </div>
          {select("Record type", recordTypeId, setRecordTypeId, recordTypes, true)}
          {needsCategory && select("Category", categoryId, setCategoryId, categories)}
          {select("Location", locationId, setLocationId, locations, false)}
          <label className="flex flex-col gap-1 text-caption text-ink-muted">
            Date it happened
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="rounded-md border border-line bg-raised px-2.5 py-2 text-body text-ink"
            />
          </label>
        </aside>

        <section className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-caption font-medium text-ink-muted">The report</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={12}
              className="rounded-xl border border-line bg-surface px-4 py-3 leading-relaxed"
              placeholder="What happened, in your words. This becomes the narrative of the PDF."
            />
          </label>

          <div
            role="button"
            tabIndex={0}
            aria-label="Add photos"
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
              addPhotos(e.dataTransfer.files);
            }}
            className={`flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 text-center ${
              dragOver ? "border-accent bg-accent-soft/40" : "border-line bg-surface"
            }`}
          >
            <IconCamera className="h-5 w-5 text-ink-muted" />
            <p className="text-ink-muted">
              {photos.length === 0
                ? "Drop photos here, or click to choose (JPEG/PNG, up to 5)"
                : `${photos.length} of ${MAX_PHOTOS} photos — drop or click to add more`}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={(e) => addPhotos(e.target.files)}
            />
          </div>

          {photos.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {photos.map((photo, i) => (
                <li
                  key={`${photo.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-line bg-surface py-1.5 pl-2.5 pr-1.5"
                >
                  <IconCamera className="h-4 w-4 text-ink-muted" />
                  <span className="max-w-40 truncate text-caption font-medium">{photo.name}</span>
                  <button
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Remove ${photo.name}`}
                    className="pressable rounded-md px-1.5 text-ink-muted hover:text-urgent"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={fileIt} disabled={busy}>
              {busy ? "Filing…" : "File it"}
            </Button>
            {message && <p className="text-caption text-urgent">{message}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
