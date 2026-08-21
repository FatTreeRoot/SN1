import type {
  HealthResult,
  RecordMetadata,
  StorageAdapter,
  StoredItem,
  StoredItemSummary,
} from "./types";
import { libraries, sites, type SiteKey } from "@/config/storage-map";

/**
 * GraphStorageAdapter — the production adapter.
 *
 * Every write happens server-side under the application's service identity
 * (client credentials), granted Sites.Selected on the three named sites
 * only — see docs/IT-REQUEST.md for the exact permission request. The
 * browser never holds a Graph credential; users authenticate for identity,
 * the API authorises, and this adapter files.
 *
 * Uploads stream through Graph upload sessions from memory — request
 * bodies are never written to this server's disk. A file whose metadata
 * write fails is retried and then rolled back (deleted) so an untagged
 * file never remains in a confidential library. Graph 429 responses are
 * honoured via Retry-After — a whole team syncing at shift change will
 * throttle.
 *
 * Implementation note: Graph is called over plain HTTPS rather than the
 * Graph SDK — the call surface is five endpoints, and fewer dependencies
 * on this path means less to audit. The interface above is identical.
 *
 * This adapter activates with STORAGE_ADAPTER=graph once the tenant app
 * registration exists; until then MockStorageAdapter serves development
 * and demos. Exercised against a real tenant as part of go-live, not
 * unit-testable without one.
 */

const GRAPH = "https://graph.microsoft.com/v1.0";

export class GraphStorageAdapter implements StorageAdapter {
  private tenantId: string;
  private clientId: string;
  private clientSecret: string;
  private token: { value: string; expiresAt: number } | null = null;
  private siteIds = new Map<string, string>();
  private driveIds = new Map<string, string>();

  constructor() {
    const { ENTRA_TENANT_ID, ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET } = process.env;
    if (!ENTRA_TENANT_ID || !ENTRA_CLIENT_ID || !ENTRA_CLIENT_SECRET) {
      throw new Error(
        "GraphStorageAdapter requires ENTRA_TENANT_ID, ENTRA_CLIENT_ID, and " +
          "ENTRA_CLIENT_SECRET. Use STORAGE_ADAPTER=mock until the tenant is approved.",
      );
    }
    this.tenantId = ENTRA_TENANT_ID;
    this.clientId = ENTRA_CLIENT_ID;
    this.clientSecret = ENTRA_CLIENT_SECRET;
  }

  /** Client-credentials token, cached until near expiry. */
  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;
    const res = await fetch(
      `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      },
    );
    if (!res.ok) throw new Error(`Token acquisition failed (${res.status})`);
    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return this.token.value;
  }

  /** Graph call honouring 429/Retry-After and transient 5xx, with backoff. */
  private async graph(
    path: string,
    init: RequestInit = {},
    attempt = 0,
  ): Promise<Response> {
    const token = await this.accessToken();
    const res = await fetch(path.startsWith("http") ? path : `${GRAPH}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? 2 ** attempt);
      await new Promise((r) => setTimeout(r, Math.min(retryAfter, 60) * 1000));
      return this.graph(path, init, attempt + 1);
    }
    return res;
  }

  private async siteId(siteKey: SiteKey): Promise<string> {
    const cached = this.siteIds.get(siteKey);
    if (cached) return cached;
    const url = new URL(sites[siteKey].siteUrl);
    const res = await this.graph(`/sites/${url.hostname}:${url.pathname}`);
    if (!res.ok) throw new Error(`Site ${sites[siteKey].name} not resolvable (${res.status})`);
    const body = (await res.json()) as { id: string };
    this.siteIds.set(siteKey, body.id);
    return body.id;
  }

  private async driveId(siteKey: SiteKey, libraryName: string): Promise<string> {
    const key = `${siteKey}/${libraryName}`;
    const cached = this.driveIds.get(key);
    if (cached) return cached;
    const siteId = await this.siteId(siteKey);
    const res = await this.graph(`/sites/${siteId}/drives?$select=id,name`);
    if (!res.ok) throw new Error(`Libraries not listable on ${siteKey} (${res.status})`);
    const body = (await res.json()) as { value: { id: string; name: string }[] };
    const drive = body.value.find((d) => d.name === libraryName);
    if (!drive) throw new Error(`Library "${libraryName}" not found on ${siteKey}`);
    this.driveIds.set(key, drive.id);
    return drive.id;
  }

  async putFile(input: {
    target: StoredItem["target"];
    fileName: string;
    contentType: string;
    content: Buffer;
    metadata: RecordMetadata;
  }): Promise<StoredItem> {
    const driveId = await this.driveId(
      input.target.siteKey as SiteKey,
      input.target.libraryName,
    );
    const itemPath = `${input.target.folderPath}/${input.fileName}`;

    // Upload session: content streams from memory in chunks, never via disk
    const sessionRes = await this.graph(
      `/drives/${driveId}/root:/${encodeURI(itemPath)}:/createUploadSession`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "fail" } }),
      },
    );
    if (!sessionRes.ok) throw new Error(`Upload session failed (${sessionRes.status})`);
    const session = (await sessionRes.json()) as { uploadUrl: string };

    const chunkSize = 5 * 1024 * 1024;
    let itemId = "";
    for (let start = 0; start < input.content.length; start += chunkSize) {
      const end = Math.min(start + chunkSize, input.content.length);
      const chunk = input.content.subarray(start, end);
      const res = await fetch(session.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${start}-${end - 1}/${input.content.length}`,
        },
        body: new Uint8Array(chunk),
      });
      if (!res.ok && res.status !== 202) {
        throw new Error(`Upload interrupted (${res.status})`);
      }
      if (res.status === 200 || res.status === 201) {
        itemId = ((await res.json()) as { id: string }).id;
      }
    }
    if (!itemId) throw new Error("Upload completed without an item id");

    // Metadata columns: retried, then rolled back — an untagged file never
    // stays behind in a confidential library.
    const fields = metadataToColumns(input.metadata);
    let tagged = false;
    for (let attempt = 0; attempt < 3 && !tagged; attempt++) {
      const res = await this.graph(`/drives/${driveId}/items/${itemId}/listItem/fields`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      tagged = res.ok;
      if (!tagged) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
    if (!tagged) {
      await this.graph(`/drives/${driveId}/items/${itemId}`, { method: "DELETE" });
      throw new Error("Metadata write failed; upload rolled back for requeue");
    }

    return {
      itemId: `graph:${driveId}:${itemId}`,
      fileName: input.fileName,
      target: input.target,
    };
  }

  private parseItemId(itemId: string): { driveId: string; id: string } {
    const [scheme, driveId, id] = itemId.split(":");
    if (scheme !== "graph" || !driveId || !id) throw new Error("Unknown item id format");
    return { driveId, id };
  }

  async getRecord(
    itemId: string,
  ): Promise<{ metadata: RecordMetadata; content: Buffer; contentType: string } | null> {
    const { driveId, id } = this.parseItemId(itemId);
    const metaRes = await this.graph(`/drives/${driveId}/items/${id}/listItem/fields`);
    if (!metaRes.ok) return null;
    const fields = (await metaRes.json()) as Record<string, string>;
    const contentRes = await this.graph(`/drives/${driveId}/items/${id}/content`);
    if (!contentRes.ok) return null;
    const content = Buffer.from(await contentRes.arrayBuffer());
    return {
      metadata: columnsToMetadata(fields),
      content,
      contentType: contentRes.headers.get("Content-Type") ?? "application/octet-stream",
    };
  }

  async markSuperseded(itemId: string): Promise<void> {
    const { driveId, id } = this.parseItemId(itemId);
    const res = await this.graph(`/drives/${driveId}/items/${id}/listItem/fields`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Status: "Superseded" }),
    });
    if (!res.ok) throw new Error(`Supersede mark failed (${res.status})`);
  }

  /** Query one library's list items by an indexed field filter. */
  private async queryLibrary(
    siteKey: SiteKey,
    libraryName: string,
    filter: string,
  ): Promise<(RecordMetadata & { itemId: string })[]> {
    const driveId = await this.driveId(siteKey, libraryName);
    const out: (RecordMetadata & { itemId: string })[] = [];
    let url =
      `/drives/${driveId}/list/items?$expand=fields&$top=200` +
      (filter ? `&$filter=${encodeURIComponent(filter)}` : "");
    while (url) {
      const res = await this.graph(url, {
        headers: { Prefer: "HonorNonIndexedQueriesWarningMayFailRandomly" },
      });
      if (!res.ok) break;
      const body = (await res.json()) as {
        value: { fields: Record<string, string>; driveItem?: { id: string } }[];
        "@odata.nextLink"?: string;
      };
      for (const item of body.value) {
        out.push({
          ...columnsToMetadata(item.fields),
          itemId: `graph:${driveId}:${item.driveItem?.id ?? item.fields.id}`,
        });
      }
      url = body["@odata.nextLink"] ?? "";
    }
    return out;
  }

  private allLibraries(): { siteKey: SiteKey; libraryName: string }[] {
    return Object.values(libraries).map((l) => ({
      siteKey: l.site,
      libraryName: l.libraryName,
    }));
  }

  async listRecentByUser(oid: string, days: number): Promise<StoredItemSummary[]> {
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    const results: StoredItemSummary[] = [];
    for (const lib of this.allLibraries()) {
      const rows = await this.queryLibrary(
        lib.siteKey,
        lib.libraryName,
        `fields/SubmittedByOid eq '${oid}' and fields/SyncedAt ge '${cutoff}'`,
      );
      for (const m of rows) {
        results.push({
          itemId: m.itemId,
          fileName: "",
          occurrenceNumber: m.occurrenceNumber,
          recordTypeName: m.recordTypeName,
          categoryName: m.categoryName,
          areaName: m.areaName,
          recordDate: m.recordDate,
          status: m.status,
          syncedAt: m.syncedAt,
        });
      }
    }
    return results.sort((a, b) => b.syncedAt.localeCompare(a.syncedAt));
  }

  async listByDateRange(input: {
    from: string;
    to: string;
    recordTypeId?: string;
  }): Promise<(RecordMetadata & { itemId: string })[]> {
    const results: (RecordMetadata & { itemId: string })[] = [];
    for (const lib of this.allLibraries()) {
      let filter = `fields/RecordDate ge '${input.from}' and fields/RecordDate le '${input.to}'`;
      if (input.recordTypeId) filter += ` and fields/RecordTypeId eq '${input.recordTypeId}'`;
      results.push(...(await this.queryLibrary(lib.siteKey, lib.libraryName, filter)));
    }
    return results;
  }

  async findByOccurrence(
    occurrenceNumber: string,
  ): Promise<(RecordMetadata & { itemId: string })[]> {
    const results: (RecordMetadata & { itemId: string })[] = [];
    for (const lib of this.allLibraries()) {
      results.push(
        ...(await this.queryLibrary(
          lib.siteKey,
          lib.libraryName,
          `fields/OccurrenceNumber eq '${occurrenceNumber}' or fields/Supersedes eq '${occurrenceNumber}'`,
        )),
      );
    }
    return results.sort((a, b) => a.syncedAt.localeCompare(b.syncedAt));
  }

  /** Scheduled probe: tenant drift (a permission or library change) must
   *  surface as an alert, not as a staff complaint two weeks later. */
  async healthCheck(): Promise<HealthResult[]> {
    const results: HealthResult[] = [];
    for (const [key, lib] of Object.entries(libraries)) {
      const label = `${sites[lib.site].name}/${lib.libraryName}`;
      try {
        const driveId = await this.driveId(lib.site, lib.libraryName);
        const res = await this.graph(`/drives/${driveId}/root?$select=id`);
        results.push(
          res.ok
            ? { target: label, ok: true }
            : { target: label, ok: false, message: `HTTP ${res.status}` },
        );
      } catch (err) {
        results.push({
          target: label,
          ok: false,
          message: err instanceof Error ? err.message : String(err),
        });
      }
      void key;
    }
    return results;
  }
}

/** Metadata ↔ SharePoint column names. Columns are provisioned per
 *  docs/IT-REQUEST.md and indexed from the start — views degrade past
 *  5,000 items without indexes. */
function metadataToColumns(m: RecordMetadata): Record<string, string | boolean> {
  return {
    RecordTypeId: m.recordTypeId,
    RecordTypeCode: m.recordTypeCode,
    RecordTypeName: m.recordTypeName,
    RecordDate: m.recordDate,
    OccurrenceNumber: m.occurrenceNumber,
    CategoryId: m.categoryId,
    CategoryName: m.categoryName,
    AreaId: m.areaId,
    AreaName: m.areaName,
    LocationId: m.locationId,
    LocationName: m.locationName,
    SubmittedByOid: m.submittedByOid,
    SubmittedByName: m.submittedByName,
    AuthorOid: m.authorOid,
    AuthorName: m.authorName,
    ShiftId: m.shiftId ?? "",
    VehicleId: m.vehicleId ?? "",
    VehicleName: m.vehicleName ?? "",
    Sensitivity: m.sensitivity,
    RetentionClass: m.retentionClass,
    Status: m.status,
    Supersedes: m.supersedes ?? "",
    CapturedAt: m.capturedAt,
    SyncedAt: m.syncedAt,
    ClockDivergenceFlagged: m.clockDivergenceFlagged ?? false,
    IdempotencyKey: m.idempotencyKey,
  };
}

function columnsToMetadata(f: Record<string, unknown>): RecordMetadata {
  const s = (k: string) => String(f[k] ?? "");
  return {
    recordTypeId: s("RecordTypeId"),
    recordTypeCode: s("RecordTypeCode"),
    recordTypeName: s("RecordTypeName"),
    recordDate: s("RecordDate"),
    occurrenceNumber: s("OccurrenceNumber"),
    categoryId: s("CategoryId"),
    categoryName: s("CategoryName"),
    areaId: s("AreaId"),
    areaName: s("AreaName"),
    locationId: s("LocationId"),
    locationName: s("LocationName"),
    submittedByOid: s("SubmittedByOid"),
    submittedByName: s("SubmittedByName"),
    authorOid: s("AuthorOid"),
    authorName: s("AuthorName"),
    shiftId: s("ShiftId") || undefined,
    vehicleId: s("VehicleId") || undefined,
    vehicleName: s("VehicleName") || undefined,
    sensitivity: (s("Sensitivity") || "confidential") as RecordMetadata["sensitivity"],
    retentionClass: s("RetentionClass"),
    status: (s("Status") || "Filed") as RecordMetadata["status"],
    supersedes: s("Supersedes") || undefined,
    capturedAt: s("CapturedAt"),
    syncedAt: s("SyncedAt"),
    clockDivergenceFlagged: Boolean(f["ClockDivergenceFlagged"]),
    idempotencyKey: s("IdempotencyKey"),
  };
}
