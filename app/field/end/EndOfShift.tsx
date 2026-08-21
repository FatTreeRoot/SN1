"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { t } from "@/config/strings";
import { clearQueue, usePendingQueue } from "@/lib/queue";

/**
 * End of shift confirms the queue is empty before signing out. If items are
 * pending it says so and offers the filing sheet route — it never lets the
 * user leave silently.
 */
export function EndOfShift() {
  const { count, sync } = usePendingQueue();
  const [phase, setPhase] = useState<"confirm" | "ending" | "done">("confirm");
  const [syncing, setSyncing] = useState(false);
  const [paperMode, setPaperMode] = useState(false);

  useEffect(() => {
    fetch("/api/paper-mode", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { active: boolean }) => setPaperMode(b.active))
      .catch(() => {});
  }, []);

  async function end() {
    setPhase("ending");
    await fetch("/api/shift/end", { method: "POST" });
    // Local storage clears on the way out — nothing stays on the device
    clearQueue();
    try {
      localStorage.removeItem("sn-theme");
    } catch {}
    setPhase("done");
  }

  async function trySync() {
    setSyncing(true);
    await sync();
    setSyncing(false);
  }

  if (phase === "done") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <p className="text-h3 font-display font-medium">{t("queueClear")}</p>
        <Link href="/signin" className="w-full">
          <Button variant="quiet" size="large" className="w-full">
            {t("signIn")}
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-h2 font-display font-semibold">{t("endShift")}</h1>

      {count === 0 ? (
        <>
          <p className="text-ink-muted">
            Everything is filed. Ending your shift signs you out and clears this device.
          </p>
          <Button size="large" onClick={end} disabled={phase === "ending"}>
            {phase === "ending" ? "Ending…" : t("endShift")}
          </Button>
        </>
      ) : (
        <>
          <p className="rounded-lg border border-pending bg-pending-soft px-4 py-3 font-medium text-pending">
            {t("queueNotClear", { count })}
          </p>
          <div className="flex flex-col gap-2">
            {paperMode ? (
              <>
                <Link href="/field/filing-sheet" className="w-full">
                  <Button size="large" className="w-full">
                    {t("filingSheet")}
                  </Button>
                </Link>
                <p className="text-caption text-ink-muted">
                  Paper only is on — print the sheet and hand it to your supervisor for
                  reconciliation.
                </p>
              </>
            ) : (
              <>
                <Button size="large" onClick={trySync} disabled={syncing}>
                  {syncing ? "Filing…" : "Try filing them now"}
                </Button>
                <Link href="/field/filing-sheet" className="w-full">
                  <Button variant="quiet" size="large" className="w-full">
                    {t("filingSheet")}
                  </Button>
                </Link>
              </>
            )}
          </div>
          <p className="text-caption text-ink-muted">
            The filing sheet lists what is outstanding with temporary references, for
            handing to your supervisor.
          </p>
        </>
      )}
    </main>
  );
}
