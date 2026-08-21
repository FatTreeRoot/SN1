"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The pending queue: items captured without signal, held on the device only
 * until the server acknowledges them. Rules from the brief:
 *
 * - A submission is not captured until the server acknowledges it, and the
 *   user is told so continuously until it is.
 * - Local storage holds only actively pending items, purged immediately on
 *   confirmed file. No history, no thumbnails, no drafts.
 * - Every item is individually retryable, never batched — iOS gives roughly
 *   five seconds after backgrounding.
 * - The client-generated UUID doubles as the idempotency key, so an
 *   ambiguous failure cannot double-file.
 *
 * Browser storage cannot be encrypted at rest without keys the browser
 * would also hold, so the honest mitigation is minimal retention (purge on
 * ack) plus requesting persistent storage — documented in the privacy
 * statement rather than pretended away.
 */

export type QueuedItem = {
  id: string; // client UUID, sent as the idempotency key
  recordTypeId: string;
  categoryId?: string;
  locationId?: string;
  recordDate?: string;
  capturedAt: string;
  note?: string;
  fileDataUrl?: string;
  fileType?: string;
  queuedAt: string;
};

const KEY = "sn-queue";
const listeners = new Set<() => void>();

function read(): QueuedItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as QueuedItem[];
  } catch {
    return [];
  }
}

function write(items: QueuedItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export function enqueue(item: QueuedItem) {
  write([...read().filter((i) => i.id !== item.id), item]);
}

export function removeFromQueue(id: string) {
  write(read().filter((i) => i.id !== id));
}

export function clearQueue() {
  write([]);
}

export function queueCount(): number {
  return read().length;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/** Submit one queued item. Removes it from the queue only on server ack. */
export async function trySubmitItem(item: QueuedItem): Promise<boolean> {
  const form = new FormData();
  form.set("recordTypeId", item.recordTypeId);
  if (item.categoryId) form.set("categoryId", item.categoryId);
  if (item.locationId) form.set("locationId", item.locationId);
  if (item.recordDate) form.set("recordDate", item.recordDate);
  form.set("capturedAt", item.capturedAt);
  form.set("idempotencyKey", item.id);
  if (item.note) form.set("note", item.note);
  if (item.fileDataUrl) {
    form.set(
      "file",
      new File([await dataUrlToBlob(item.fileDataUrl)], "capture", {
        type: item.fileType ?? "application/octet-stream",
      }),
    );
  }
  try {
    const res = await fetch("/api/submissions", { method: "POST", body: form });
    if (res.ok) {
      removeFromQueue(item.id);
      return true;
    }
    // 4xx other than auth: the item is malformed and retrying cannot fix it;
    // keep it queued for the filing sheet rather than dropping silently.
    return false;
  } catch {
    return false; // offline — retry later
  }
}

let syncing = false;
/** Items retry individually, oldest first; one failure does not block the rest. */
export async function syncQueue(): Promise<void> {
  if (syncing) return;
  syncing = true;
  try {
    for (const item of read()) {
      await trySubmitItem(item);
    }
    // Report queue state (counts and ages only, never content) so an aging
    // queue surfaces to a supervisor on the Desk, not just to the patroller.
    const remaining = read();
    void fetch("/api/queue-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        count: remaining.length,
        oldestQueuedAt: remaining[0]?.queuedAt ?? null,
      }),
    }).catch(() => {});
  } finally {
    syncing = false;
  }
}

/** Live queue state plus the sync triggers from the brief: app focus,
 *  `online`, a foreground timer, and `visibilitychange` (flush immediately —
 *  iOS allows ~5 seconds after backgrounding). */
export function usePendingQueue() {
  const [items, setItems] = useState<QueuedItem[]>([]);

  useEffect(() => {
    const update = () => setItems(read());
    update();
    listeners.add(update);

    navigator.storage?.persist?.().catch(() => {});

    const onOnline = () => void syncQueue();
    const onFocus = () => void syncQueue();
    const onVisibility = () => void syncQueue();
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = setInterval(() => void syncQueue(), 30_000);
    void syncQueue();

    return () => {
      listeners.delete(update);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(timer);
    };
  }, []);

  const sync = useCallback(() => syncQueue(), []);
  return { items, count: items.length, sync };
}
