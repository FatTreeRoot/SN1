import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { getAdminSetting } from "@/lib/settings";

/**
 * Pending-queue visibility: Field clients report their queue state during
 * sync so noticing an aging queue is not solely the patroller's
 * responsibility. Counts and timestamps only — never item content.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = (await request.json()) as { count?: number; oldestQueuedAt?: string | null };
  await db.appConfig.upsert({
    where: { key: `queue-status:${user.oid}` },
    create: {
      key: `queue-status:${user.oid}`,
      value: JSON.stringify({
        displayName: user.displayName,
        count: body.count ?? 0,
        oldestQueuedAt: body.oldestQueuedAt ?? null,
        reportedAt: new Date().toISOString(),
      }),
    },
    update: {
      value: JSON.stringify({
        displayName: user.displayName,
        count: body.count ?? 0,
        oldestQueuedAt: body.oldestQueuedAt ?? null,
        reportedAt: new Date().toISOString(),
      }),
    },
  });
  return NextResponse.json({ ok: true });
}

/** Supervisors read the reported queue states for the review screen. */
export async function GET() {
  const { error } = await requireUser("reviewQueue");
  if (error) return error;

  const rows = await db.appConfig.findMany({
    where: { key: { startsWith: "queue-status:" } },
  });
  const warnMinutes = await getAdminSetting("queueAgeWarnMinutes");
  const statuses = rows.map((r) => {
    const v = JSON.parse(r.value) as {
      displayName: string;
      count: number;
      oldestQueuedAt: string | null;
      reportedAt: string;
    };
    const ageMinutes = v.oldestQueuedAt
      ? Math.round((Date.now() - new Date(v.oldestQueuedAt).getTime()) / 60_000)
      : 0;
    return { ...v, ageMinutes, alert: v.count > 0 && ageMinutes > warnMinutes };
  });
  return NextResponse.json({ statuses, warnMinutes });
}
