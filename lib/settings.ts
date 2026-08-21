import { db } from "@/lib/db";

/** Admin-editable settings: environment defaults, database overrides win. */
export const EDITABLE_KEYS = ["suppressionThreshold", "queueAgeWarnMinutes"] as const;
export type EditableKey = (typeof EDITABLE_KEYS)[number];

const envDefaults: Record<EditableKey, number> = {
  suppressionThreshold: Number(process.env.SUPPRESSION_THRESHOLD ?? 5),
  queueAgeWarnMinutes: Number(process.env.QUEUE_AGE_WARN_MINUTES ?? 120),
};

export async function getAdminSetting(key: EditableKey): Promise<number> {
  const row = await db.appConfig.findUnique({ where: { key: `setting:${key}` } });
  return row ? Number(JSON.parse(row.value)) : envDefaults[key];
}
