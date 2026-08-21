/** Initials chip. Hue derives from the name so each person keeps a stable
 *  colour, drawn from the Nation family. */
const hues = [
  "var(--sn-rt-cfs-strong)",
  "var(--sn-rt-shf-strong)",
  "var(--sn-rt-flt-strong)",
  "var(--sn-rt-cem-strong)",
  "var(--sn-accent)",
];

export function Avatar({
  name,
  size = "default",
  className = "",
}: {
  name: string;
  size?: "default" | "large";
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = hues[hash % hues.length];

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-on-accent ${
        size === "large" ? "h-12 w-12 text-body-lg" : "h-9 w-9 text-caption"
      } ${className}`}
      style={{ backgroundColor: hue }}
    >
      {initials}
    </span>
  );
}
