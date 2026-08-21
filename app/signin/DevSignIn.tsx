"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { t } from "@/config/strings";

type DevUserOption = { oid: string; displayName: string; roles: string[] };

/**
 * Development sign-in: pick a simulated user per role. Marked clearly so a
 * demo audience knows this screen is replaced by Entra sign-in.
 */
export function DevSignIn({ users }: { users: DevUserOption[] }) {
  const router = useRouter();
  const [surface, setSurface] = useState<"field" | "desk">("field");
  const [pendingAck, setPendingAck] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    if (body.needsAcknowledgement) {
      setPendingAck(true);
    } else {
      router.push(surface === "desk" ? "/desk" : "/field");
    }
  }

  async function acknowledge() {
    await fetch("/api/auth/acknowledge", { method: "POST" });
    router.push(surface === "desk" ? "/desk" : "/field");
  }

  if (pendingAck) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6">
        <h2 className="text-h3 font-semibold">{t("acceptableUseTitle")}</h2>
        <p className="text-ink-muted">{t("acceptableUseBody")}</p>
        <Button size="large" onClick={acknowledge}>
          {t("acceptableUseAgree")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-md border border-dashed border-line-strong bg-surface px-3 py-2 text-center text-caption text-ink-muted">
        Development sign-in — replaced by Microsoft Entra ID in production
      </p>
      <div className="flex gap-2" role="radiogroup" aria-label="Surface">
        {(["field", "desk"] as const).map((s) => (
          <button
            key={s}
            role="radio"
            aria-checked={surface === s}
            onClick={() => setSurface(s)}
            className={`pressable flex-1 rounded-md border px-3 py-2 font-medium ${
              surface === s
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-line bg-surface text-ink-muted"
            }`}
          >
            {s === "field" ? "Field" : "Desk"}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <button
            key={u.oid}
            onClick={() => signIn(u.oid)}
            disabled={busy !== null}
            className="pressable flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3 text-left hover:border-line-strong disabled:opacity-50"
          >
            <span className="font-medium">{u.displayName}</span>
            <span className="text-caption text-ink-muted">
              {busy === u.oid ? "Signing in…" : u.roles.join(" · ")}
            </span>
          </button>
        ))}
      </div>
      {message && <p className="text-center text-caption text-urgent">{message}</p>}
    </div>
  );
}
