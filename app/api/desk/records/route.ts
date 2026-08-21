import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { getStorageAdapter } from "@/lib/storage";
import { localDateIso } from "@/lib/filing";

/** Metadata listing for the Desk surfaces. Supervisors see team records;
 *  narrative content is never in this response. */
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser("viewTeam");
  if (error) return error;

  const params = request.nextUrl.searchParams;
  const to = params.get("to") ?? localDateIso();
  const from =
    params.get("from") ?? localDateIso(new Date(Date.now() - 30 * 86_400_000));
  const recordTypeId = params.get("type") ?? undefined;

  const items = await getStorageAdapter().listByDateRange({ from, to, recordTypeId });
  // Strip anything beyond listing metadata; content stays behind viewNarrative
  const rows = items
    .map((m) => ({
      itemId: m.itemId,
      occurrenceNumber: m.occurrenceNumber,
      recordTypeId: m.recordTypeId,
      recordTypeName: m.recordTypeName,
      categoryName: m.categoryName,
      areaName: m.areaName,
      locationName: m.locationName,
      recordDate: m.recordDate,
      status: m.status,
      submittedByName: m.submittedByName,
      authorName: m.authorName,
      sensitivity: m.sensitivity,
      syncedAt: m.syncedAt,
      supersedes: m.supersedes,
    }))
    .sort((a, b) => b.syncedAt.localeCompare(a.syncedAt));
  void user;
  return NextResponse.json({ items: rows });
}
