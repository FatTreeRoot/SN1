import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { appendAudit } from "@/lib/auth/audit";
import { requireUser } from "@/lib/auth/guard";
import { fileRecord, FilingError } from "@/lib/filing";
import { buildQuarterReport } from "@/lib/reporting/aggregate";
import { renderQuarterPdf } from "@/lib/reporting/pdf";

/** On-screen report data: aggregate in memory, return, discard. */
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser("report");
  if (error) return error;

  const quarter = request.nextUrl.searchParams.get("quarter");
  if (!quarter) return NextResponse.json({ error: "quarter is required." }, { status: 400 });

  try {
    const report = await buildQuarterReport(quarter);
    await appendAudit({
      actorOid: user.oid,
      action: "run-report",
      surface: user.surface,
      detail: { quarter },
    });
    return NextResponse.json({ report });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "The report did not build." },
      { status: 400 },
    );
  }
}

/** Generate the Council PDF, file it back to storage, discard everything. */
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser("report");
  if (error) return error;

  const { quarter } = (await request.json()) as { quarter?: string };
  if (!quarter) return NextResponse.json({ error: "quarter is required." }, { status: 400 });

  try {
    const report = await buildQuarterReport(quarter);
    const pdf = await renderQuarterPdf(report);
    const result = await fileRecord({
      user,
      recordTypeId: "RT-QRP",
      recordDate: report.to,
      capturedAt: new Date().toISOString(),
      idempotencyKey: randomUUID(),
      areaId: "AREA-OT",
      content: { buffer: pdf, contentType: "application/pdf" },
    });
    await appendAudit({
      actorOid: user.oid,
      action: "export",
      surface: user.surface,
      recordType: "QRP",
      itemId: result.itemId,
      detail: { quarter },
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FilingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "The report did not generate." },
      { status: 500 },
    );
  }
}
