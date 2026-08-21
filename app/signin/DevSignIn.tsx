"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { t } from "@/config/strings";

type DevUserOption = { oid: string; displayName: string; roles: string[] };

/** Microsoft logo mark (four squares), inline so nothing loads externally. */
function MicrosoftMark() {
  return (
    <svg aria-hidden viewBox="0 0 21 21" className="h-4.5 w-4.5">
      <rect x="0" y="0" width="10" height="10" fill="#f25022" />
      <rect x="11" y="0" width="10" height="10" fill="#7fba00" />
      <rect x="0" y="11" width="10" height="10" fill="#00a4ef" />
      <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
    </svg>
  );
}

export function DevSignIn({ bypass, users }: { bypass: boolean; users: DevUserOption[] }) {
  const router = useRouter();
  const [demoOpen, setDemoOpen] = useState(false);
  const [surface, setSurface] = useState<"field" | "desk">("field");
  const [pendingAck, setPendingAck] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function microsoftClick() {
    if (bypass) {
      setDemoOpen(true);
      setMessage(null);
    }
    // In entra mode this navigates to the authorization code flow
  }

  async function signIn(oid: string) {
    setBusy(oid);
    setMessage(null);
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oid, surface }),
    });
    setBusy(null);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "The server did not confirm. Try again.");
      return;
    }
    const body = (await res.json()) as { needsAcknowledgement: boolean };
    if (body.needsAcknowledgement) setPendingAck(true);
    else router.push(surface === "desk" ? "/desk" : "/field");
  }

  async function acknowledge() {
    await fetch("/api/auth/acknowledge", { method: "POST" });
    router.push(surface === "desk" ? "/desk" : "/field");
  }

  if (pendingAck) {
    return (
      <div className="animate-lift flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
        <h2 className="text-h3 font-display font-semibold">{t("acceptableUseTitle")}</h2>
        <p className="text-ink-muted">{t("acceptableUseBody")}</p>
        <Button size="large" onClick={acknowledge}>
          {t("acceptableUseAgree")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={microsoftClick}
        className="pressable flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-line bg-raised px-6 py-3.5 font-medium hover:border-line-strong"
      >
        <MicrosoftMark />
        Sign in with Microsoft
      </button>
      <p className="text-center text-caption text-ink-muted">{t("signInHint")}</p>

      {bypass && demoOpen && (
        <div className="animate-lift flex flex-col gap-4 rounded-xl border border-line bg-surface/95 p-5">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-caption font-medium uppercase tracking-wide text-ink-muted">
              Demo access
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <p className="text-caption text-ink-muted">
            Microsoft sign-in activates when the Nation&apos;s tenant is connected. Until
            then, try {""}
            <span className="text-ink">SN Connect</span> as any role.
          </p>
          <div className="flex gap-2" role="radiogroup" aria-label="Surface">
            {(["field", "desk"] as const).map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={surface === s}
                onClick={() => setSurface(s)}
                className={`pressable flex-1 rounded-lg border px-3 py-2.5 font-medium ${
                  surface === s
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-line bg-surface text-ink-muted"
                }`}
              >
                {s === "field" ? "Field · phone" : "Desk · office"}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <button
                key={u.oid}
                onClick={() => signIn(u.oid)}
                disabled={busy !== null}
                className="pressable flex items-center gap-3 rounded-lg border border-line bg-raised px-3.5 py-2.5 text-left hover:border-line-strong disabled:opacity-50"
              >
                <Avatar name={u.displayName} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium leading-tight">
                    {u.displayName}
                  </span>
                  <span className="block truncate text-caption text-ink-muted">
                    {u.roles.map((r) => r.replace("PS-", "")).join(" · ")}
                  </span>
                </span>
                {busy === u.oid && (
                  <span className="text-caption text-ink-muted">Signing in…</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      {message && <p className="text-center text-caption text-urgent">{message}</p>}
    </div>
  );
}
