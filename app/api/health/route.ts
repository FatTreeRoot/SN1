import { NextResponse } from "next/server";
import { appendAudit } from "@/lib/auth/audit";
import { getStorageAdapter } from "@/lib/storage";

/**
 * Health probe, run on a schedule by the platform. Verifies each target
 * library is reachable/writable so tenant drift surfaces as an alert.
 * Returns states only — never tenant URLs or errors with content in them.
 */
export async function GET() {
  try {
    const results = await getStorageAdapter().healthCheck();
    const failing = results.filter((r) => !r.ok);
    if (failing.length > 0) {
      await appendAudit({
        actorOid: "system",
        action: "health-alert",
        detail: { failingTargets: failing.length },
      });
    }
    return NextResponse.json(
      {
        ok: failing.length === 0,
        targets: results.map((r) => ({ target: r.target, ok: r.ok })),
      },
      { status: failing.length === 0 ? 200 : 503 },
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
