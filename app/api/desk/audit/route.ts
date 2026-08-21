import { NextRequest, NextResponse } from "next/server";
import { appendAudit } from "@/lib/auth/audit";
import { requireUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";

/** Audit log for managers. Reading the audit is itself audited. */
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser("viewAudit");
  if (error) return error;

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 200), 500);
  const entries = await db.auditEntry.findMany({
    orderBy: { at: "desc" },
    take: limit,
  });

  await appendAudit({ actorOid: user.oid, action: "view-audit", surface: user.surface });
  return NextResponse.json({ entries });
}
