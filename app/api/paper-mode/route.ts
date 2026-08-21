import { NextRequest, NextResponse } from "next/server";
import { appendAudit } from "@/lib/auth/audit";
import { requireUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";

/**
 * Paper-only mode: declared by a supervisor when the system or tenant is
 * unavailable to the field. Every signed-in user sees the banner; end of
 * shift switches to the paper reconciliation path.
 */
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  const row = await db.appConfig.findUnique({ where: { key: "paper-only-mode" } });
  const state = row
    ? (JSON.parse(row.value) as { active: boolean; declaredBy: string; at: string })
    : { active: false, declaredBy: "", at: "" };
  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser("reviewQueue");
  if (error) return error;

  const { active } = (await request.json()) as { active?: boolean };
  const state = {
    active: Boolean(active),
    declaredBy: user.displayName,
    at: new Date().toISOString(),
  };
  await db.appConfig.upsert({
    where: { key: "paper-only-mode" },
    create: { key: "paper-only-mode", value: JSON.stringify(state), updatedBy: user.oid },
    update: { value: JSON.stringify(state), updatedBy: user.oid },
  });
  await appendAudit({
    actorOid: user.oid,
    action: state.active ? "paper-mode-on" : "paper-mode-off",
    surface: user.surface,
  });
  return NextResponse.json(state);
}
