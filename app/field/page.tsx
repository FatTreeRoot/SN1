import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { activeBlocks } from "@/lib/occurrence/blocks";
import { rtSoft, rtStrong } from "@/lib/rt-hue";
import { getActiveShift } from "@/lib/shift";
import { getVocabularies } from "@/lib/vocab";
import { HorizonRule } from "@/components/ui/HorizonRule";
import { IconClipboard, IconFlag, IconMoon, IconPhone, IconTruck } from "@/components/icons";
import { t } from "@/config/strings";

const iconFor: Record<string, React.ReactNode> = {
  "RT-CFS": <IconPhone />,
  "RT-ESC": <IconFlag />,
  "RT-FLT": <IconTruck />,
  "RT-SHF": <IconClipboard />,
};

function greeting(): string {
  const h = new Date().getHours();
  return h < 5 ? "Quiet hours" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/**
 * Field home: greeting, the shift at a glance, and the record-type grid —
 * "tap what kind of thing you have." Each type carries its own hue.
 */
export default async function FieldHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const shift = await getActiveShift(user.oid);
  if (!shift) redirect("/field/shift");

  const recordTypes = getVocabularies().recordTypes.filter(
    (rt) => rt.enabled && rt.surface.includes("field") && rt.id !== "RT-FLT",
  );
  const preIssued = await activeBlocks(user.oid);
  const startedAt = shift.startedAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6">
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <HorizonRule />
        <div>
          <p className="text-caption text-ink-muted">{greeting()}</p>
          <h1 className="font-display text-h2 font-semibold leading-tight">
            {user.displayName.split(" ")[0]}
          </h1>
        </div>
        <p className="text-caption text-ink-muted">
          On shift since <span className="font-data text-ink">{startedAt}</span> ·{" "}
          {shift.vehicleName} · {shift.areaName}
          {shift.partnerName ? ` · with ${shift.partnerName.split(" ")[0]}` : ""}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {recordTypes.map((rt) => (
          <Link
            key={rt.id}
            href={`/field/submit/${rt.id}`}
            className="pressable flex min-h-32 flex-col items-start justify-between gap-2 rounded-xl border border-line bg-surface p-4 text-left hover:border-line-strong"
          >
            <span
              aria-hidden
              className="flex h-11 w-11 items-center justify-center rounded-lg [&>svg]:h-6 [&>svg]:w-6"
              style={{ backgroundColor: rtSoft(rt.id), color: rtStrong(rt.id) }}
            >
              {iconFor[rt.id] ?? <IconClipboard />}
            </span>
            <span className="font-display text-body-lg font-medium leading-tight">
              {rt.name}
            </span>
          </Link>
        ))}
      </div>

      {preIssued.length > 0 && (
        <section className="rounded-xl border border-line bg-surface p-4">
          <p className="text-caption font-medium text-ink-muted">
            Your numbers for paper capture
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 font-data">
            {preIssued.map((n) => (
              <span key={n}>{n}</span>
            ))}
          </p>
          <p className="mt-2 text-caption text-ink-muted">
            Write one on the page at the scene; it files under the same number later.
          </p>
        </section>
      )}

      <Link
        href="/field/end"
        className="pressable mt-auto flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 font-medium"
      >
        <IconMoon className="h-5 w-5 text-ink-muted" />
        {t("endShift")}
      </Link>
    </main>
  );
}
