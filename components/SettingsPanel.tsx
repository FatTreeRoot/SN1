"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconSignOut } from "@/components/icons";
import { ThemeToggle } from "@/lib/theme/ThemeToggle";
import { clearQueue } from "@/lib/queue";

/**
 * Settings, shared by both surfaces: appearance, language, devices, sign
 * out, and about. Field adds the end-of-shift shortcut. Everything here is
 * per-device or per-account; nothing touches records.
 */
export function SettingsPanel({
  surface,
  displayName,
  email,
  roles,
  appName,
  nation,
  department,
  version,
}: {
  surface: "field" | "desk";
  displayName: string;
  email: string;
  roles: string[];
  appName: string;
  nation: string;
  department: string;
  version: string;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/signout", { method: "POST" });
    if (surface === "field") clearQueue();
    router.push("/signin");
    router.refresh();
  }

  const section = (title: string, children: React.ReactNode) => (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
      <h2 className="text-h3 font-display font-medium">{title}</h2>
      {children}
    </section>
  );

  return (
    <main
      className={`mx-auto flex w-full flex-1 flex-col gap-5 px-4 py-6 ${
        surface === "desk" ? "max-w-2xl px-8 py-8" : "max-w-md"
      }`}
    >
      <PageHeader title="Settings" back={{ fallback: surface === "desk" ? "/desk" : "/field" }} />

      <section className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5">
        <Avatar name={displayName} size="large" />
        <div className="min-w-0">
          <p className="truncate font-display text-body-lg font-semibold">{displayName}</p>
          <p className="truncate text-caption text-ink-muted">{email}</p>
          <p className="truncate text-caption text-ink-muted">{roles.join(" · ")}</p>
        </div>
      </section>

      {section(
        "Appearance",
        <div className="flex flex-col gap-2">
          <ThemeToggle />
          <p className="text-caption text-ink-muted">
            Auto follows this surface&apos;s default — dark on patrol so night vision is
            kept, light at a desk.
          </p>
        </div>,
      )}

      {section(
        "Language",
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-lg border border-accent bg-accent-soft px-3 py-2.5">
            <span className="font-medium text-accent-strong">English</span>
            <span className="text-caption text-accent-strong">Active</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-ink-muted">
            <span>Sḵwx̱wú7mesh sníchim</span>
            <span className="text-caption">Awaiting Nation-supplied terms</span>
          </div>
        </div>,
      )}

      {section(
        "Your devices",
        <div className="flex flex-col gap-2">
          <p className="text-caption text-ink-muted">
            Up to three devices at a time — a fourth sign-in drops the oldest.
          </p>
          <Link href="/account/sessions" className="self-start">
            <Button variant="quiet">Manage devices</Button>
          </Link>
        </div>,
      )}

      {surface === "field" &&
        section(
          "Shift",
          <div className="flex flex-col gap-2">
            <p className="text-caption text-ink-muted">
              Ending your shift checks the queue is empty, signs you out, and clears this
              device.
            </p>
            <Link href="/field/end" className="self-start">
              <Button variant="quiet">End shift</Button>
            </Link>
          </div>,
        )}

      {section(
        "Sign out",
        <div className="flex flex-col gap-2">
          <p className="text-caption text-ink-muted">
            Signs this device out{surface === "field" ? " and clears anything pending" : ""}.
            Your filed records are unaffected.
          </p>
          <Button
            variant="destructive"
            onClick={signOut}
            disabled={signingOut}
            className="self-start"
          >
            <span className="flex items-center gap-2">
              <IconSignOut className="h-4.5 w-4.5" />
              {signingOut ? "Signing out…" : "Sign out"}
            </span>
          </Button>
        </div>,
      )}

      <footer className="flex flex-col items-center gap-1 py-4 text-center text-caption text-ink-muted">
        <p className="font-medium text-ink">
          {appName} {version}
        </p>
        <p>
          {nation} · {department}
        </p>
      </footer>
    </main>
  );
}
