import { identity, logo } from "@/config/branding";

/**
 * The Nation's brand mark. The logo is supplied by the Nation — never
 * generated or approximated. Until assets are provided in config/branding.ts,
 * this renders a clearly marked neutral placeholder at the correct aspect
 * ratio so layouts are right before the real asset arrives.
 *
 * Required formats and dimensions are documented in docs/BRANDING.md.
 */
export function BrandMark({
  variant = "full",
  className = "",
}: {
  /** "full" for sign-in, headers, and documents; "compact" for the mobile header. */
  variant?: "full" | "compact";
  className?: string;
}) {
  const compact = variant === "compact";
  const aspectRatio = compact ? logo.compactAspectRatio : logo.aspectRatio;
  const lightSrc = compact ? logo.compact : logo.light;
  const darkSrc = compact ? logo.compact : logo.dark;

  if (!lightSrc && !darkSrc) {
    return (
      <div
        role="img"
        aria-label={`${identity.nation} logo placeholder`}
        style={{ aspectRatio }}
        className={`flex items-center justify-center rounded-sm border border-dashed border-line-strong bg-surface text-ink-muted ${
          compact ? "text-[11px]" : "text-caption"
        } ${className}`}
      >
        {compact ? "SN" : `${identity.nation} logo`}
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={(lightSrc ?? darkSrc)!}
        alt={`${identity.nation} logo`}
        style={{ aspectRatio }}
        className={`brand-on-light ${className}`}
      />
      {darkSrc && darkSrc !== lightSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={darkSrc}
          alt=""
          aria-hidden
          style={{ aspectRatio }}
          className={`brand-on-dark hidden ${className}`}
        />
      )}
    </>
  );
}
