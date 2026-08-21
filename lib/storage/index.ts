import { GraphStorageAdapter } from "./graph";
import { MockStorageAdapter } from "./mock";
import type { StorageAdapter } from "./types";

/** Adapter selection by environment. Everything above this line is
 *  identical between development/demo and production. */
let adapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!adapter) {
    adapter =
      process.env.STORAGE_ADAPTER === "graph"
        ? new GraphStorageAdapter()
        : new MockStorageAdapter();
  }
  return adapter;
}

export * from "./types";
export { generateFileName, extensionFor } from "./naming";
