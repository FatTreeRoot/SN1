import { db } from "@/lib/db";

export async function paperModeActive(): Promise<{
  active: boolean;
  declaredBy: string;
  at: string;
}> {
  const row = await db.appConfig.findUnique({ where: { key: "paper-only-mode" } });
  return row
    ? (JSON.parse(row.value) as { active: boolean; declaredBy: string; at: string })
    : { active: false, declaredBy: "", at: "" };
}
