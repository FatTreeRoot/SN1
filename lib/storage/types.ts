/**
 * The storage adapter boundary. Everything above this interface is identical
 * whether records land in the Nation's SharePoint tenant (GraphStorageAdapter)
 * or a local mock directory (MockStorageAdapter, for development and client
 * demos before tenant access exists). Selected by STORAGE_ADAPTER.
 *
 * Confidential content passes through these methods as streams/buffers and
 * is never persisted anywhere else — not in the database, not in logs.
 */

export type Sensitivity = "standard" | "confidential" | "restricted";

/** Core metadata written on every item regardless of type. Stable ids are
 *  stored alongside every display value — future linking depends on them. */
export type RecordMetadata = {
  recordTypeId: string;
  recordTypeCode: string;
  recordTypeName: string;
  /** The date of the occurrence, not the upload date. */
  recordDate: string; // YYYY-MM-DD
  occurrenceNumber: string;
  categoryId: string;
  categoryName: string;
  areaId: string;
  areaName: string;
  locationId: string;
  locationName: string;
  /** From the validated token, never typed. */
  submittedByOid: string;
  submittedByName: string;
  /** Defaults to submitter; editable by supervisors. */
  authorOid: string;
  authorName: string;
  shiftId?: string;
  vehicleId?: string;
  vehicleName?: string;
  /** Defaults by record type. Can be raised, never lowered. */
  sensitivity: Sensitivity;
  /** Auto by record type, never shown to the user. */
  retentionClass: string;
  status: "Filed" | "Superseded";
  /** Occurrence number of the record this one supersedes, if a correction. */
  supersedes?: string;
  /** Device clock at creation. */
  capturedAt: string; // ISO
  /** Server clock at acceptance. Divergence beyond threshold is flagged. */
  syncedAt: string; // ISO
  clockDivergenceFlagged?: boolean;
  /** Client-generated idempotency key. */
  idempotencyKey: string;
};

export type StorageTarget = {
  siteKey: string;
  siteName: string;
  libraryName: string;
  folderPath: string; // Year/Month
};

export type StoredItem = {
  itemId: string;
  fileName: string;
  target: StorageTarget;
};

export type StoredItemSummary = {
  itemId: string;
  fileName: string;
  occurrenceNumber: string;
  recordTypeName: string;
  categoryName: string;
  areaName: string;
  recordDate: string;
  status: string;
  syncedAt: string;
};

export type HealthResult = {
  target: string;
  ok: boolean;
  message?: string;
};

export interface StorageAdapter {
  /**
   * Stream one file plus its metadata into the target. Must be atomic from
   * the caller's view: on failure nothing untagged may remain (partial
   * failure completes on retry or rolls back — never an untagged file in a
   * confidential library).
   */
  putFile(input: {
    target: StorageTarget;
    fileName: string;
    contentType: string;
    content: Buffer;
    metadata: RecordMetadata;
  }): Promise<StoredItem>;

  /** Metadata-only listing of a user's recent submissions, read live —
   *  never cached on the device. */
  listRecentByUser(oid: string, days: number): Promise<StoredItemSummary[]>;

  /** Metadata-only query for reporting and review surfaces. */
  listByDateRange(input: {
    from: string;
    to: string;
    recordTypeId?: string;
  }): Promise<(RecordMetadata & { itemId: string })[]>;

  /** Verifies write access to each target library; a permission change in
   *  the tenant surfaces as an alert, not a staff complaint weeks later. */
  healthCheck(): Promise<HealthResult[]>;

  /** Full record (metadata + content) for the Desk record view. The only
   *  path that returns narrative content, guarded by viewNarrative —
   *  which the Field surface never holds. */
  getRecord(
    itemId: string,
  ): Promise<{ metadata: RecordMetadata; content: Buffer; contentType: string } | null>;

  /** Append-only correction support: the earlier version is marked
   *  Superseded in place (a metadata-only change — the file itself is
   *  never edited or deleted). */
  markSuperseded(itemId: string): Promise<void>;

  /** All versions sharing an occurrence chain, oldest first. */
  findByOccurrence(
    occurrenceNumber: string,
  ): Promise<(RecordMetadata & { itemId: string })[]>;
}
