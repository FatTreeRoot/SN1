/** Dashboard stat: a number with its label, optionally carrying a hue. */
export function StatTile({
  value,
  label,
  hint,
  hue,
  hueSoft,
}: {
  value: string | number;
  label: string;
  hint?: string;
  /** CSS colour (e.g. from rtStrong) for the value and top rule. */
  hue?: string;
  hueSoft?: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4"
      style={hueSoft ? { backgroundColor: hueSoft } : undefined}
    >
      <span
        aria-hidden
        className="mb-1 h-[3px] w-8 rounded-full"
        style={{ backgroundColor: hue ?? "var(--sn-accent)" }}
      />
      <span className="font-data text-h1 font-medium leading-none" style={hue ? { color: hue } : undefined}>
        {value}
      </span>
      <span className="font-medium">{label}</span>
      {hint && <span className="text-caption text-ink-muted">{hint}</span>}
    </div>
  );
}
