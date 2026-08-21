import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { OccurrenceNumber } from "@/components/ui/OccurrenceNumber";
import { PendingBanner } from "@/components/ui/PendingBanner";
import { StatusChip } from "@/components/ui/StatusChip";
import { Tile } from "@/components/ui/Tile";
import { identity, themes } from "@/config/branding";
import { ThemeToggle } from "@/lib/theme/ThemeToggle";

/**
 * Checkpoint 2 demonstration page: tokens, type, and core components in both
 * themes. Not part of the product; it exists so the design system can be
 * reviewed on its own.
 */

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 7h13v9H1zM14 10h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="17.5" cy="18" r="1.8" />
    </svg>
  );
}
function IconFlag() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 21V4m0 1h13l-2.5 4L18 13H5" />
    </svg>
  );
}

function Swatches({ themeName }: { themeName: "light" | "dark" }) {
  const theme = themes[themeName];
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {Object.entries(theme).map(([name, hex]) => (
        <div key={name} className="flex flex-col gap-1">
          <div
            className="h-10 rounded-md border border-line"
            style={{ backgroundColor: hex }}
          />
          <span className="text-[11px] leading-tight text-ink-muted">{name}</span>
          <span className="font-data text-[11px] leading-tight text-ink-muted">{hex}</span>
        </div>
      ))}
    </div>
  );
}

function ComponentSet() {
  return (
    <div className="flex flex-col gap-6">
      <PendingBanner count={1} />
      <div className="flex flex-wrap items-center gap-3">
        <Button>File it</Button>
        <Button variant="quiet">Not now</Button>
        <Button variant="destructive">Remove this device</Button>
      </div>
      <div className="grid max-w-md grid-cols-2 gap-3">
        <Tile icon={<IconPhone />} label="Call for service" />
        <Tile icon={<IconTruck />} label="Fleet check" hint="Start of shift" />
      </div>
      <div className="flex flex-wrap gap-2">
        <StatusChip status="filed" />
        <StatusChip status="pending" />
        <StatusChip status="urgent" />
        <StatusChip status="superseded" />
      </div>
      <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4">
        <span className="text-caption text-ink-muted">Write this on your notebook page</span>
        <OccurrenceNumber value="PS-2026-0820-0031" size="large" />
      </div>
      <div className="flex flex-col gap-2">
        <Disclosure title="Calls for service" summary="12 this week">
          <p className="text-ink-muted">
            Anything that expands shows a chevron — program summaries, individual report
            boxes, admin sections.
          </p>
        </Disclosure>
        <Disclosure title="PS-2026-0820-0031 · Wellness check" summary="Filed" defaultOpen>
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">North Shore · Vehicle 4</span>
            <StatusChip status="filed" />
          </div>
        </Disclosure>
      </div>
    </div>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 flex flex-col gap-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-caption text-ink-muted">
            {identity.nation} · {identity.department}
          </p>
          <h1 className="text-h1 font-semibold">{identity.appName} design system</h1>
          <p className="mt-2 max-w-xl text-ink-muted">
            Tokens, type, and core components in the Nation&apos;s palette, sampled from
            squamish.net pending the brand standards document. Cedar red leads the
            interface; escalation uses the brighter urgent red with filled treatments so
            it still reads apart.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-h2 font-semibold">Brand mark</h2>
        <p className="text-caption text-ink-muted">
          Placeholder until the Nation supplies assets — never generated.
        </p>
        <div className="flex items-end gap-6">
          <BrandMark className="w-60" />
          <BrandMark variant="compact" className="w-12" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-semibold">Type</h2>
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6">
          <p className="font-display text-display font-semibold">Signing on, not filling in</p>
          <p className="text-h2 font-display font-semibold">Filed where it belongs</p>
          <p className="text-h3 font-display font-medium">Squamish Valley · North Shore</p>
          <p className="text-body">
            Body at 17px, Inter. A patroller reads this one-handed, at night, in a vehicle.
            Nothing on the Field surface renders below 16px.
          </p>
          <p className="text-caption text-ink-muted">
            Caption at 14px — Desk surface only.
          </p>
          <p className="font-data text-body">PS-2026-0820-0031 · 0O 1lI · 03:41</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-semibold">Both themes</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div data-theme="light" className="rounded-xl border border-line bg-bg p-6 text-ink">
            <p className="mb-4 text-caption text-ink-muted">Light — Desk default</p>
            <Swatches themeName="light" />
            <div className="mt-6">
              <ComponentSet />
            </div>
          </div>
          <div data-theme="dark" className="rounded-xl border border-line bg-bg p-6 text-ink">
            <p className="mb-4 text-caption text-ink-muted">Dark — Field default</p>
            <Swatches themeName="dark" />
            <div className="mt-6">
              <ComponentSet />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
