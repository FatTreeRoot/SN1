import { NextResponse } from "next/server";
import { appendAudit } from "@/lib/auth/audit";
import { requireUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";

/** Records the acceptable-use acknowledgement on first sign-in. */
export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  await db.user.update({
    where: { entraOid: user.oid },
    data: { acceptedUseAt: new Date() },
  });
  await appendAudit({ actorOid: user.oid, action: "accept-use", surface: user.surface });
  return NextResponse.json({ ok: true });
}
