import { NextRequest, NextResponse } from "next/server";
import { appendAudit } from "@/lib/auth/audit";
import { requireUser } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { EDITABLE_KEYS, getAdminSetting, type EditableKey } from "@/lib/settings";

export async function GET() {
  const { error } = await requireUser("admin");
  if (error) return error;
  const settings: Record<string, number> = {};
  for (const key of EDITABLE_KEYS) settings[key] = await getAdminSetting(key);
  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser("admin");
  if (error) return error;

  const body = (await request.json()) as Partial<Record<EditableKey, number>>;
  for (const key of EDITABLE_KEYS) {
    const value = body[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      await db.appConfig.upsert({
        where: { key: `setting:${key}` },
        create: { key: `setting:${key}`, value: JSON.stringify(value), updatedBy: user.oid },
        update: { value: JSON.stringify(value), updatedBy: user.oid },
      });
      await appendAudit({
        actorOid: user.oid,
        action: "config-change",
        surface: user.surface,
        detail: { key, value },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
