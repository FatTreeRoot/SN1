"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { HorizonBackdrop } from "@/components/HorizonBackdrop";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { t } from "@/config/strings";

type Option = { id: string; name: string };

/**
 * The signature element: signing on, not filling in. A full-bleed horizon
 * keyed to the hour, the member's name set large and calm, three one-tap
 * choices assembling into a shift line, one confirming action. Everything
 * else in the application stays quiet so this screen carries the weight.
 */
export function ShiftSignOn({
  displayName,
  vehicles,
  areas,
  partners,
}: {
  displayName: string;
  vehicles: Option[];
  areas: Option[];
  partners: { oid: string; name: string }[];
}) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [partnerOid, setPartnerOid] = useState<string | null>(null);
  const [damageNote, setDamageNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const now = useMemo(() => new Date(), []);
  const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateLabel = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const summary = [
    vehicleId && vehicles.find((v) => v.id === vehicleId)?.name,
    areaId && areas.find((a) => a.id === areaId)?.name,
    partnerOid && `with ${partners.find((p) => p.oid === partnerOid)?.name.split(" ")[0]}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const ready = vehicleId && areaId;

  async function start() {
    if (!ready || busy) return;
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.set("vehicleId", vehicleId!);
    form.set("areaId", areaId!);
    if (partnerOid) {
      form.set("partnerOid", partnerOid);
      form.set("partnerName", partners.find((p) => p.oid === partnerOid)?.name ?? "");
    }
    if (damageNote) form.set("damageNote", damageNote);
    const photo = photoRef.current?.files?.[0];
    if (photo) form.set("photo", photo);

    const res = await fetch("/api/shift", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "The shift did not start. Try again.");
      return;
    }
    router.push("/field");
    router.refresh();
  }

  function choiceGroup<T extends string>(
    label: string,
    options: { id: T; name: string }[],
    value: T | null,
    onPick: (id: T) => void,
  ) {
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-caption font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </legend>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={value === o.id}
              onClick={() => onPick(o.id)}
              className={`pressable min-h-12 rounded-lg border px-4 py-2.5 font-medium ${
                value === o.id
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-line bg-surface/80 text-ink"
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <main className="relative flex flex-1 flex-col">
      <HorizonBackdrop />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col gap-7 px-4 pb-10 pt-12">
        <div>
          <p className="text-caption text-ink-muted">{dateLabel}</p>
          <h1 className="mt-1 font-display text-display font-semibold leading-tight">
            {displayName}
          </h1>
          <p className="mt-1 font-data text-h3 text-ink-muted">{timeLabel}</p>
        </div>

        {choiceGroup(t("shiftVehicle"), vehicles, vehicleId, setVehicleId)}
        {choiceGroup(t("shiftArea"), areas, areaId, setAreaId)}
        {choiceGroup(
          t("shiftPartner"),
          partners.map((p) => ({ id: p.oid, name: p.name.split(" ")[0] })),
          partnerOid,
          setPartnerOid,
        )}

        <Disclosure title={t("shiftWalkaround")} summary={t("shiftWalkaroundHint")}>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-caption text-ink-muted">Photo</span>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="text-caption file:mr-3 file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-ink"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-caption text-ink-muted">Damage note</span>
              <textarea
                value={damageNote}
                onChange={(e) => setDamageNote(e.target.value)}
                rows={2}
                className="rounded-md border border-line bg-surface px-3 py-2"
                placeholder="Anything to note on the vehicle"
              />
            </label>
          </div>
        </Disclosure>

        <div className="mt-auto flex flex-col gap-3">
          <p
            aria-live="polite"
            className={`min-h-6 text-center font-medium ${summary ? "text-ink" : "text-ink-muted"}`}
          >
            {summary || "Choose vehicle and area to sign on"}
          </p>
          <Button size="large" disabled={!ready || busy} onClick={start}>
            {busy ? "Starting…" : t("startShift")}
          </Button>
          {message && <p className="text-center text-caption text-urgent">{message}</p>}
        </div>
      </div>
    </main>
  );
}
