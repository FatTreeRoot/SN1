/**
 * File names are always generated, never typed:
 * 2026-08-20_CFS_PS-2026-0820-0031_NorthShore.pdf
 */
export function generateFileName(input: {
  recordDate: string; // YYYY-MM-DD
  recordTypeCode: string;
  occurrenceNumber: string;
  areaName: string;
  extension: string; // without dot
}): string {
  const area = input.areaName.replace(/[^A-Za-z0-9]/g, "");
  return `${input.recordDate}_${input.recordTypeCode}_${input.occurrenceNumber}_${area}.${input.extension}`;
}

export function extensionFor(contentType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/heic": "heic",
    "text/plain": "txt",
    "application/json": "json",
  };
  return map[contentType] ?? "bin";
}
