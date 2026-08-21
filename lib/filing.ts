import { appendAudit } from "@/lib/auth/audit";
import type { AppUser } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { isTracked, queueTrackerAppend } from "@/lib/excel/tracker";
import { ownsPreIssued } from "@/lib/occurrence/blocks";
import { nextOccurrenceNumber } from "@/lib/occurrence/generate";
import {
  extensionFor,
  generateFileName,
  getStorageAdapter,
  type RecordMetadata,
  type Sensitivity,
} from "@/lib/storage";
import { folderPathFor, resolveLibrary, sites } from "@/config/storage-map";
import { getArea, getCategory, getLocation, getRecordType } from "@/lib/vocab";

/**
 * The one path every record takes to storage: validate against controlled
 * vocabularies, allocate the occurrence number, generate the file name,
 * resolve the destination, stream through the adapter, record the
 * idempotency outcome, audit the act (never the content).
 */

/** System values for structural record types (fleet check, shift report)
 *  where an incident category or street location does not apply. */
export const NOT_APPLICABLE = { id: "NA", name: "Not applicable" } as const;

const SENSITIVITY_ORDER: Sensitivity[] = ["standard", "confidential", "restricted"];

/** Today in the server's local timezone (America/Vancouver in production) —
 *  a record filed at 21:50 local must not date itself tomorrow via UTC. */
export function localDateIso(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export class FilingError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export type FilingInput = {
  user: AppUser;
  recordTypeId: string;
  categoryId?: string;
  locationId?: string;
  /** YYYY-MM-DD; the date of the occurrence, defaults to today. */
  recordDate?: string;
  /** ISO device clock at creation. */
  capturedAt: string;
  /** Client-generated UUID. */
  idempotencyKey: string;
  /** A number from a block pre-issued to this user (written on paper at
   *  the scene). Validated against the issued blocks; otherwise generated. */
  preIssuedOccurrence?: string;
  /** Raise-only; defaults from the record type. */
  sensitivity?: Sensitivity;
  /** Occurrence number this filing supersedes (corrections). */
  supersedes?: string;
  content: { buffer: Buffer; contentType: string };
  /** On-behalf-of author (supervisors); defaults to submitter. */
  author?: { oid: string; name: string };
  shift?: {
    id: string;
    vehicleId: string;
    vehicleName: string;
    areaId: string;
    areaName: string;
  } | null;
  /** Area override when no shift context exists (Desk filing). */
  areaId?: string;
};

export type FilingResult = {
  occurrenceNumber: string;
  itemId: string;
  fileName: string;
  duplicate: boolean;
};

export async function fileRecord(input: FilingInput): Promise<FilingResult> {
  const recordType = getRecordType(input.recordTypeId);
  if (!recordType) throw new FilingError("Unknown or disabled record type.");

  // Idempotency: an ambiguous failure cannot double-file. A completed key
  // returns the original outcome; a failed key may retry.
  const existing = await db.idempotencyKey.findUnique({
    where: { key: input.idempotencyKey },
  });
  if (existing?.status === "filed" && existing.occurrence && existing.itemId) {
    return {
      occurrenceNumber: existing.occurrence,
      itemId: existing.itemId,
      fileName: "",
      duplicate: true,
    };
  }
  if (!existing) {
    await db.idempotencyKey.create({
      data: { key: input.idempotencyKey, actorOid: input.user.oid, status: "accepted" },
    });
  }

  const category = input.categoryId ? getCategory(input.categoryId) : NOT_APPLICABLE;
  if (!category) throw new FilingError("Unknown category.");
  const location = input.locationId ? getLocation(input.locationId) : NOT_APPLICABLE;
  if (!location) throw new FilingError("Unknown location.");

  // Area: from shift context, explicit override, or the location's area
  const areaId =
    input.shift?.areaId ??
    input.areaId ??
    ("areaId" in location ? (location as { areaId: string }).areaId : undefined);
  const area = areaId ? getArea(areaId) : undefined;
  if (!area) throw new FilingError("An area is required.");

  // Sensitivity defaults by record type and can be raised, never lowered
  const defaultSensitivity = recordType.sensitivityDefault;
  let sensitivity = input.sensitivity ?? defaultSensitivity;
  if (
    SENSITIVITY_ORDER.indexOf(sensitivity) < SENSITIVITY_ORDER.indexOf(defaultSensitivity)
  ) {
    sensitivity = defaultSensitivity;
  }

  const recordDate = input.recordDate ?? localDateIso();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(recordDate)) {
    throw new FilingError("Record date must be YYYY-MM-DD.");
  }

  let occurrenceNumber: string;
  if (input.preIssuedOccurrence) {
    if (!(await ownsPreIssued(input.user.oid, input.preIssuedOccurrence))) {
      throw new FilingError("That number is not from a block issued to you.");
    }
    occurrenceNumber = input.preIssuedOccurrence;
  } else {
    occurrenceNumber = await nextOccurrenceNumber(new Date(`${recordDate}T12:00:00`));
  }

  const syncedAt = new Date();
  const capturedAt = new Date(input.capturedAt);
  const divergenceMinutes = Number(process.env.CLOCK_DIVERGENCE_MINUTES ?? 10);
  const clockDivergenceFlagged =
    Math.abs(syncedAt.getTime() - capturedAt.getTime()) > divergenceMinutes * 60_000;

  const lib = resolveLibrary(recordType.routing, sensitivity);
  const site = sites[lib.site];
  const target = {
    siteKey: lib.site,
    siteName: site.name,
    libraryName: lib.libraryName,
    folderPath: folderPathFor(new Date(`${recordDate}T12:00:00`)),
  };

  const fileName = generateFileName({
    recordDate,
    recordTypeCode: recordType.code,
    occurrenceNumber,
    areaName: area.name,
    extension: extensionFor(input.content.contentType),
  });

  const author = input.author ?? { oid: input.user.oid, name: input.user.displayName };

  const metadata: RecordMetadata = {
    recordTypeId: recordType.id,
    recordTypeCode: recordType.code,
    recordTypeName: recordType.name,
    recordDate,
    occurrenceNumber,
    categoryId: category.id,
    categoryName: category.name,
    areaId: area.id,
    areaName: area.name,
    locationId: location.id,
    locationName: location.name,
    submittedByOid: input.user.oid,
    submittedByName: input.user.displayName,
    authorOid: author.oid,
    authorName: author.name,
    shiftId: input.shift?.id,
    vehicleId: input.shift?.vehicleId,
    vehicleName: input.shift?.vehicleName,
    sensitivity,
    retentionClass: recordType.retentionClass,
    status: "Filed",
    supersedes: input.supersedes,
    capturedAt: capturedAt.toISOString(),
    syncedAt: syncedAt.toISOString(),
    clockDivergenceFlagged,
    idempotencyKey: input.idempotencyKey,
  };

  try {
    const stored = await getStorageAdapter().putFile({
      target,
      fileName,
      contentType: input.content.contentType,
      content: input.content.buffer,
      metadata,
    });

    await db.idempotencyKey.update({
      where: { key: input.idempotencyKey },
      data: { status: "filed", occurrence: occurrenceNumber, itemId: stored.itemId },
    });

    await appendAudit({
      actorOid: input.user.oid,
      action: "submit",
      surface: input.user.surface,
      recordType: recordType.code,
      itemId: stored.itemId,
      detail: { occurrenceNumber, supersedes: input.supersedes ?? "" },
    });

    // Incident types append to the confidential tracker. A locked or
    // drifted workbook keeps the row queued — the record is already filed.
    if (isTracked(recordType.id)) {
      await queueTrackerAppend(stored.itemId, occurrenceNumber).catch(() => {});
    }

    return { occurrenceNumber, itemId: stored.itemId, fileName, duplicate: false };
  } catch (err) {
    await db.idempotencyKey.update({
      where: { key: input.idempotencyKey },
      data: { status: "failed" },
    });
    throw err;
  }
}
