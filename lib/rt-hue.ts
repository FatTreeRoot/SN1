/** CSS variable references for a record type's hue pair (see
 *  recordTypeHues in config/branding.ts). Unknown types fall back to the
 *  stone gray pair. */
export function rtStrong(recordTypeId: string): string {
  const key = recordTypeId.replace("RT-", "").toLowerCase() || "cci";
  return `var(--sn-rt-${key}-strong, var(--sn-ink-muted))`;
}

export function rtSoft(recordTypeId: string): string {
  const key = recordTypeId.replace("RT-", "").toLowerCase() || "cci";
  return `var(--sn-rt-${key}-soft, var(--sn-surface))`;
}
