"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SessionRow = {
  id: string;
  surface: string;
  deviceLabel: string;
  lastSeenAt: string;
  current: boolean;
};

export function SessionList({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function revoke(sessionId: string) {
    setBusy(sessionId);
    await fetch("/api/auth/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    setBusy(null);
    router.refresh();
  }

  if (sessions.length === 0) {
    return <p className="text-ink-muted">No active devices. Sign in to add one.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {sessions.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3"
        >
          <div className="min-w-0">
            <p className="font-medium">
              {s.deviceLabel}
              {s.current && <span className="ml-2 text-caption text-accent">This device</span>}
            </p>
            <p className="text-caption text-ink-muted">
              {s.surface === "field" ? "Field" : "Desk"} · last active{" "}
              {new Date(s.lastSeenAt).toLocaleString()}
            </p>
          </div>
          {!s.current && (
            <button
              onClick={() => revoke(s.id)}
              disabled={busy !== null}
              className="pressable shrink-0 rounded-md border border-line px-3 py-1.5 text-caption text-ink-muted hover:border-urgent hover:text-urgent disabled:opacity-50"
            >
              {busy === s.id ? "Signing out…" : "Sign out"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
