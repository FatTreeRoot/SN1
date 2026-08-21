import type {
  HealthResult,
  RecordMetadata,
  StorageAdapter,
  StoredItem,
  StoredItemSummary,
} from "./types";

/**
 * GraphStorageAdapter — the production adapter. Streams uploads into
 * Microsoft Graph upload sessions under the application's service identity
 * (Sites.Selected on three named sites) and writes metadata columns.
 * Never buffers request bodies to disk.
 *
 * Fully implemented at checkpoint 10 when the tenant documentation lands;
 * until then it fails loudly so a misconfigured environment cannot fall
 * back to anything silently.
 */
export class GraphStorageAdapter implements StorageAdapter {
  constructor() {
    if (!process.env.ENTRA_TENANT_ID || !process.env.ENTRA_CLIENT_ID) {
      throw new Error(
        "GraphStorageAdapter requires ENTRA_TENANT_ID and ENTRA_CLIENT_ID. " +
          "Use STORAGE_ADAPTER=mock until the tenant is approved.",
      );
    }
  }

  putFile(_input: {
    target: StoredItem["target"];
    fileName: string;
    contentType: string;
    content: Buffer;
    metadata: RecordMetadata;
  }): Promise<StoredItem> {
    throw new Error("GraphStorageAdapter arrives at checkpoint 10.");
  }

  listRecentByUser(_oid: string, _days: number): Promise<StoredItemSummary[]> {
    throw new Error("GraphStorageAdapter arrives at checkpoint 10.");
  }

  listByDateRange(_input: {
    from: string;
    to: string;
    recordTypeId?: string;
  }): Promise<(RecordMetadata & { itemId: string })[]> {
    throw new Error("GraphStorageAdapter arrives at checkpoint 10.");
  }

  healthCheck(): Promise<HealthResult[]> {
    throw new Error("GraphStorageAdapter arrives at checkpoint 10.");
  }

  getRecord(
    _itemId: string,
  ): Promise<{ metadata: RecordMetadata; content: Buffer; contentType: string } | null> {
    throw new Error("GraphStorageAdapter arrives at checkpoint 10.");
  }

  markSuperseded(_itemId: string): Promise<void> {
    throw new Error("GraphStorageAdapter arrives at checkpoint 10.");
  }

  findByOccurrence(
    _occurrenceNumber: string,
  ): Promise<(RecordMetadata & { itemId: string })[]> {
    throw new Error("GraphStorageAdapter arrives at checkpoint 10.");
  }
}
