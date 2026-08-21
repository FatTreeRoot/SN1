"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";
import { IconCamera, IconPaperclip } from "@/components/icons";
import { t } from "@/config/strings";
import { enqueue } from "@/lib/queue";

type Option = { id: string; name: string };
type LocationOption = Option & { areaId: string };

/**
 * Category tile → capture → file it. A submission is not captured until the
 * server acknowledges it; a failure queues the item on-device, individually
 * retryable, and the pending banner stays lit until it files.
 */
export function SubmitFlow({
  recordType,
  categories,
  locations,
  shiftAreaId,
  needsCategory,
}: {
  recordType: { id: string; name: string; code: string };
  categories: Option[];
  locations: LocationOption[];
  shiftAreaId: string;
  needsCategory: boolean;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(needsCategory ? null : "NA");
  const [locationId, setLocationId] = useState<string | null>(null);
  const [recordDate, setRecordDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [state, setState] = useState<
    | { phase: "form" }
    | { phase: "submitting" }
    | { phase: "done"; occurrence: string }
    | { phase: "queued" }
    | { phase: "error"; message: string }
  >({ phase: "form" });
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const localLocations = locations.filter((l) => l.areaId === shiftAreaId);
  const visibleLocations = showAllLocations ? locations : localLocations;

  function pickFile(input: HTMLInputElement | null) {
    const f = input?.files?.[0];
    setFileName(f ? f.name : null);
  }

  async function fileIt() {
    const file = cameraRef.current?.files?.[0] ?? fileRef.current?.files?.[0];
    if (!file && !note.trim()) {
      setState({ phase: "error", message: "Attach a photo or file, or add a note, then file it." });
      return;
    }
    const id = crypto.randomUUID();
    const capturedAt = new Date().toISOString();
    setState({ phase: "submitting" });

    const form = new FormData();
    form.set("recordTypeId", recordType.id);
    if (categoryId && categoryId !== "NA") form.set("categoryId", categoryId);
    if (locationId) form.set("locationId", locationId);
    form.set("recordDate", recordDate);
    form.set("capturedAt", capturedAt);
    form.set("idempotencyKey", id);
    if (note.trim()) form.set("note", note.trim());
    if (file) form.set("file", file);

    try {
      const res = await fetch("/api/submissions", { method: "POST", body: form });
      if (res.ok) {
        const body = (await res.json()) as { occurrenceNumber: string };
        setState({ phase: "done", occurrence: body.occurrenceNumber });
        return;
      }
      if (res.status === 400 || res.status === 403) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setState({ phase: "error", message: body?.error ?? "That did not file. Check the details." });
        return;
      }
      // Server trouble: keep it on the device and keep telling the user
      await queueLocally(id, capturedAt, file);
    } catch {
      await queueLocally(id, capturedAt, file);
    }
  }

  async function queueLocally(id: string, capturedAt: string, file?: File) {
    let fileDataUrl: string | undefined;
    let fileType: string | undefined;
    if (file) {
      fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      fileType = file.type;
    }
    enqueue({
      id,
      recordTypeId: recordType.id,
      categoryId: categoryId && categoryId !== "NA" ? categoryId : undefined,
      locationId: locationId ?? undefined,
      recordDate,
      capturedAt,
      note: note.trim() || undefined,
      fileDataUrl,
      fileType,
      queuedAt: new Date().toISOString(),
    });
    setState({ phase: "queued" });
  }

  if (state.phase === "done") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <div className="animate-lift flex w-full flex-col items-center gap-3 rounded-xl border border-filed bg-filed-soft p-6">
          <p className="font-medium text-filed">{t("filed")}</p>
          <CountIn value={state.occurrence} />
          <p className="text-ink-muted">{t("writeItDown")}</p>
        </div>
        <Link href="/field" className="w-full">
          <Button variant="quiet" size="large" className="w-full">
            Done
          </Button>
        </Link>
      </main>
    );
  }

  if (state.phase === "queued") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <div className="animate-lift flex w-full flex-col items-center gap-3 rounded-xl border border-pending bg-pending-soft p-6">
          <p className="font-medium text-pending">{t("notYetFiled")}</p>
          <p className="text-ink">{t("errorOffline")}</p>
        </div>
        <Link href="/field" className="w-full">
          <Button variant="quiet" size="large" className="w-full">
            Back to home
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="text-h2 font-display font-semibold">{recordType.name}</h1>

      {needsCategory && !categoryId && (
        <div className="grid grid-cols-2 gap-2.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className="pressable min-h-20 rounded-lg border border-line bg-surface p-3 text-left font-medium"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {(categoryId || !needsCategory) && (
        <div className="flex flex-col gap-5">
          {needsCategory && categoryId && categoryId !== "NA" && (
            <button
              onClick={() => setCategoryId(null)}
              className="self-start rounded-full border border-accent bg-accent-soft px-3 py-1 text-caption font-medium text-accent-strong"
            >
              {categories.find((c) => c.id === categoryId)?.name} · change
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => cameraRef.current?.click()}
              className="pressable flex min-h-20 flex-col items-start justify-between rounded-lg border border-line bg-surface p-3"
            >
              <IconCamera className="h-6 w-6 text-accent" />
              <span className="font-medium">Take photo</span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="pressable flex min-h-20 flex-col items-start justify-between rounded-lg border border-line bg-surface p-3"
            >
              <IconPaperclip className="h-6 w-6 text-accent" />
              <span className="font-medium">Attach file</span>
            </button>
          </div>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={() => pickFile(cameraRef.current)}
          />
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={() => pickFile(fileRef.current)}
          />
          {fileName && (
            <p className="rounded-md border border-line bg-surface px-3 py-2 text-caption text-ink-muted">
              Attached: {fileName}
            </p>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-caption font-medium text-ink-muted">
              Note — use the microphone on your keyboard to dictate
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="rounded-lg border border-line bg-surface px-3 py-2.5"
              placeholder="What happened, in your words"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-caption font-medium text-ink-muted">Date it happened</span>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="rounded-lg border border-line bg-surface px-3 py-2.5"
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-caption font-medium text-ink-muted">Location</legend>
            <div className="flex flex-wrap gap-2">
              {visibleLocations.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={locationId === l.id}
                  onClick={() => setLocationId(l.id)}
                  className={`pressable rounded-lg border px-3 py-2 font-medium ${
                    locationId === l.id
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-line bg-surface"
                  }`}
                >
                  {l.name}
                </button>
              ))}
              {!showAllLocations && localLocations.length < locations.length && (
                <button
                  type="button"
                  onClick={() => setShowAllLocations(true)}
                  className="rounded-lg border border-dashed border-line px-3 py-2 text-ink-muted"
                >
                  More…
                </button>
              )}
            </div>
          </fieldset>

          <Button
            size="large"
            onClick={fileIt}
            disabled={state.phase === "submitting"}
            className="mt-2"
          >
            {state.phase === "submitting" ? "Filing…" : t("fileIt")}
          </Button>
          {state.phase === "error" && (
            <p role="alert" className="text-center text-caption text-urgent">
              {state.message}
            </p>
          )}
        </div>
      )}
    </main>
  );
}

/** The occurrence number counts into place — the moment the patroller
 *  needs to trust, so it is definite. Instant under reduced motion. */
function CountIn({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const match = value.match(/^(.*-)(\d{4})$/);
    if (!match) return;
    const [, prefix, digits] = match;
    const target = Number(digits);
    const start = Math.max(0, target - 24);
    let current = start;
    const timer = setInterval(() => {
      current = Math.min(target, current + Math.max(1, Math.round((target - current) / 4)));
      setDisplay(`${prefix}${String(current).padStart(4, "0")}`);
      if (current >= target) clearInterval(timer);
    }, 45);
    return () => clearInterval(timer);
  }, [value]);

  return <OccurrenceNumber value={display} size="large" />;
}
