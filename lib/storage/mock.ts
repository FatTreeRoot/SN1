import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  HealthResult,
  RecordMetadata,
  StorageAdapter,
  StoredItem,
  StoredItemSummary,
} from "./types";
import { libraries, sites } from "@/config/storage-map";

/**
 * MockStorageAdapter — development and demonstration only.
 *
 * Simulates the SharePoint tenant with a local directory tree
 * (site/library/year/month) and a JSON metadata sidecar per file, so the
 * client can see the exact filing structure before IT approves tenant
 * access. Includes realistic latency and occasional simulated failures so
 * the offline and retry states can be demonstrated honestly.
 *
 * In production STORAGE_ADAPTER=graph and this directory does not exist;
 * the mock directory stands in for the tenant, which is why writing to it
 * does not violate the no-content-on-our-infrastructure constraint in dev.
 */
export class MockStorageAdapter implements StorageAdapter {
  private root: string;
  private failureRate: number;
  private minLatency = 250;
  private maxLatency = 900;

  constructor() {
    this.root = path.resolve(process.env.MOCK_STORAGE_DIR ?? "./.mock-storage");
    this.failureRate = Number(process.env.MOCK_FAILURE_RATE ?? 0.05);
  }

  private async simulate() {
    const ms = this.minLatency + Math.random() * (this.maxLatency - this.minLatency);
    await new Promise((r) => setTimeout(r, ms));
    if (Math.random() < this.failureRate) {
      throw new Error("Simulated storage failure (mock adapter)");
    }
  }

  private dirFor(target: { siteName: string; libraryName: string; folderPath: string }) {
    return path.join(this.root, target.siteName, target.libraryName, target.folderPath);
  }

  async putFile(input: {
    target: StoredItem["target"];
    fileName: string;
    contentType: string;
    content: Buffer;
    metadata: RecordMetadata;
  }): Promise<StoredItem> {
    await this.simulate();
    const dir = this.dirFor(input.target);
    await mkdir(dir, { recursive: true });

    // Two-phase write: content to a temp name, then metadata, then rename.
    // An interrupted write never leaves an untagged file in the library.
    const finalPath = path.join(dir, input.fileName);
    const tempPath = `${finalPath}.uploading`;
    const sidecarPath = `${finalPath}.metadata.json`;

    await writeFile(tempPath, input.content);
    try {
      await writeFile(
        sidecarPath,
        JSON.stringify(
          { ...input.metadata, contentType: input.contentType, fileName: input.fileName },
          null,
          2,
        ),
      );
      await rename(tempPath, finalPath);
    } catch (err) {
      await unlink(tempPath).catch(() => {});
      await unlink(sidecarPath).catch(() => {});
      throw err;
    }

    return {
      itemId: `mock:${path.relative(this.root, finalPath).replaceAll("\\", "/")}`,
      fileName: input.fileName,
      target: input.target,
    };
  }

  private async *sidecars(): AsyncGenerator<
    RecordMetadata & { fileName: string; itemId: string }
  > {
    const entries: string[] = [];
    const walk = async (dir: string) => {
      const items = await readdir(dir, { withFileTypes: true }).catch(() => []);
      for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) await walk(full);
        else if (item.name.endsWith(".metadata.json")) entries.push(full);
      }
    };
    await walk(this.root);
    for (const file of entries) {
      try {
        const meta = JSON.parse(await readFile(file, "utf8"));
        const contentPath = file.slice(0, -".metadata.json".length);
        meta.itemId = `mock:${path.relative(this.root, contentPath).replaceAll("\\", "/")}`;
        yield meta;
      } catch {
        // Unreadable sidecar: skip rather than fail the listing
      }
    }
  }

  async listRecentByUser(oid: string, days: number): Promise<StoredItemSummary[]> {
    await this.simulate();
    const cutoff = Date.now() - days * 86_400_000;
    const out: StoredItemSummary[] = [];
    for await (const meta of this.sidecars()) {
      if (meta.submittedByOid !== oid) continue;
      if (new Date(meta.syncedAt).getTime() < cutoff) continue;
      out.push({
        itemId: meta.itemId,
        fileName: meta.fileName,
        occurrenceNumber: meta.occurrenceNumber,
        recordTypeName: meta.recordTypeName,
        categoryName: meta.categoryName,
        areaName: meta.areaName,
        recordDate: meta.recordDate,
        status: meta.status,
        syncedAt: meta.syncedAt,
      });
    }
    return out.sort((a, b) => b.syncedAt.localeCompare(a.syncedAt));
  }

  async listByDateRange(input: {
    from: string;
    to: string;
    recordTypeId?: string;
  }): Promise<(RecordMetadata & { itemId: string })[]> {
    const out: (RecordMetadata & { itemId: string })[] = [];
    for await (const meta of this.sidecars()) {
      if (meta.recordDate < input.from || meta.recordDate > input.to) continue;
      if (input.recordTypeId && meta.recordTypeId !== input.recordTypeId) continue;
      out.push(meta);
    }
    return out;
  }

  /** itemId format is "mock:<relative path>" (see putFile). */
  private pathForItem(itemId: string): string | null {
    if (!itemId.startsWith("mock:")) return null;
    const rel = itemId.slice(5);
    const full = path.resolve(this.root, rel);
    // The id must resolve inside the mock root — never outside it
    if (!full.startsWith(this.root)) return null;
    return full;
  }

  async getRecord(
    itemId: string,
  ): Promise<{ metadata: RecordMetadata; content: Buffer; contentType: string } | null> {
    const full = this.pathForItem(itemId);
    if (!full) return null;
    try {
      const metadata = JSON.parse(await readFile(`${full}.metadata.json`, "utf8")) as
        RecordMetadata & { contentType?: string };
      const content = await readFile(full);
      return {
        metadata,
        content,
        contentType: metadata.contentType ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  }

  async markSuperseded(itemId: string): Promise<void> {
    const full = this.pathForItem(itemId);
    if (!full) throw new Error("Unknown item.");
    const sidecarPath = `${full}.metadata.json`;
    const metadata = JSON.parse(await readFile(sidecarPath, "utf8")) as RecordMetadata;
    // Metadata-only status change; the file content is never touched
    metadata.status = "Superseded";
    await writeFile(sidecarPath, JSON.stringify(metadata, null, 2));
  }

  async findByOccurrence(
    occurrenceNumber: string,
  ): Promise<(RecordMetadata & { itemId: string })[]> {
    const out: (RecordMetadata & { fileName: string; itemId: string })[] = [];
    for await (const meta of this.sidecars()) {
      if (
        meta.occurrenceNumber === occurrenceNumber ||
        meta.supersedes === occurrenceNumber
      ) {
        out.push(meta);
      }
    }
    return out.sort((a, b) => a.syncedAt.localeCompare(b.syncedAt));
  }

  async healthCheck(): Promise<HealthResult[]> {
    const results: HealthResult[] = [];
    for (const [key, lib] of Object.entries(libraries)) {
      const site = sites[lib.site];
      try {
        const dir = path.join(this.root, site.name, lib.libraryName);
        await mkdir(dir, { recursive: true });
        results.push({ target: `${site.name}/${lib.libraryName}`, ok: true });
      } catch (err) {
        results.push({
          target: `${site.name}/${lib.libraryName}`,
          ok: false,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return results;
  }
}
