import { db } from "@/lib/db";

/**
 * Append-only audit log: who, when, what action, which record type, which
 * item. Never what the record says — `detail` carries structured
 * non-content facts only (ids, counts, config keys).
 */
export async function appendAudit(entry: {
  actorOid: string;
  action: string;
  surface?: string;
  recordType?: string;
  itemId?: string;
  detail?: Record<string, string | number | boolean>;
}) {
  await db.auditEntry.create({
    data: {
      actorOid: entry.actorOid,
      action: entry.action,
      surface: entry.surface,
      recordType: entry.recordType,
      itemId: entry.itemId,
      detail: entry.detail ? JSON.stringify(entry.detail) : undefined,
    },
  });
}
