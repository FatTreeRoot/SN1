/**
 * SN Connect — branding configuration.
 *
 * The single place where identity lives. Every colour, logo reference, and
 * type-scale value in the application resolves through this file; the root
 * layout emits these values as CSS custom properties, so swapping the palette
 * or dropping in the Nation's real assets is a change here and nowhere else.
 *
 * PROVISIONAL: the palette below is sampled from the Nation's public web
 * presence (squamish.net, August 2026), pending the official brand standards
 * document. Replace values here when it arrives.
 */

export const identity = {
  /** Application name shown on the home screen, sign-in, headers, documents. */
  appName: "SN Connect",
  department: "Public Safety Department",
  nation: "Squamish Nation",
  /** Short name for the home-screen icon (12 chars or fewer renders unclipped). */
  shortName: "SN Connect",
} as const;

/**
 * Logo assets, supplied by the Nation — never generated or approximated.
 * Leave a value null and <BrandMark /> renders a clearly marked placeholder
 * at the correct aspect ratio. See docs/BRANDING.md for required formats.
 */
export const logo = {
  light: null as string | null, // e.g. "/brand/logo-on-light.svg"
  dark: null as string | null, // e.g. "/brand/logo-on-dark.svg"
  compact: null as string | null, // square mark for the mobile header
  aspectRatio: "3 / 1",
  compactAspectRatio: "1 / 1",
} as const;

/**
 * Raw palette, sampled from squamish.net.
 * The Nation's brand is red-forward; in a safety application red means
 * escalation, so the everyday interface is carried by charcoal, teal, and
 * sand, and the brand red is reserved for urgent status, escalation, and
 * destructive confirmations. Do not promote it to a general accent.
 */
export const palette = {
  charcoal: "#231f20",
  teal700: "#1f545c",
  teal600: "#2d747d",
  teal500: "#3d98a2",
  teal300: "#8cc3c9",
  teal150: "#d9eaec",
  sand300: "#dbd5cd",
  sand100: "#f3f1ec",
  sand50: "#faf9f6",
  gray600: "#545d66",
  gray400: "#a2aab2",
  gray200: "#e1e3e6",
  red600: "#c8102e",
  red500: "#db2419",
  ochre500: "#d79023",
  ochre600: "#a06a12",
  green600: "#2e7d52",
} as const;

/**
 * Semantic theme tokens — the Nation's brand leads (client direction,
 * August 2026): cedar red carries primary actions, navigation, and brand
 * chrome, exactly as it leads on squamish.net. Escalation stays
 * distinguishable through the brighter urgent red plus filled treatments
 * and iconography. Teal supports as the water/horizon hue; sand and
 * charcoal carry the surfaces.
 *
 * Both surfaces ship both themes; Field defaults to dark (night shifts —
 * no large light surfaces at 0300), Desk defaults to light.
 */
export const themes = {
  light: {
    bg: "#f7f4ef",
    surface: "#fdfcfa",
    raised: "#ffffff",
    ink: palette.charcoal,
    inkMuted: "#554f50",
    line: "#e2ddd6",
    lineStrong: "#a8a19b",
    accent: palette.red600,
    accentStrong: "#9c0a22",
    accentSoft: "#faeae8",
    onAccent: "#ffffff",
    water: palette.teal600,
    urgent: palette.red500,
    onUrgent: "#ffffff",
    pending: palette.ochre600,
    pendingSoft: "#f4e8d2",
    filed: palette.green600,
    filedSoft: "#ddece3",
  },
  dark: {
    bg: "#161314",
    surface: "#201c1d",
    raised: "#2a2526",
    ink: "#ece8e3",
    inkMuted: "#a9a2a0",
    line: "#383233",
    lineStrong: "#544d4e",
    accent: "#e05a4b",
    accentStrong: "#ea7a6d",
    accentSoft: "#3a1e1b",
    onAccent: "#1d0a08",
    water: "#6fb5bd",
    urgent: "#f2503f",
    onUrgent: "#1d0a08",
    pending: palette.ochre500,
    pendingSoft: "#332810",
    filed: "#57a97e",
    filedSoft: "#182a20",
  },
} as const;

export type ThemeName = keyof typeof themes;
export type ThemeTokens = Record<keyof (typeof themes)["light"], string>;

/**
 * Typography. Self-hosted variable fonts only — no font CDN calls.
 * Scale is a 1.25 ratio anchored at 17px body (Field floor is 16px;
 * the Field surface promotes captions to 16px via .surface-field).
 */
export const typography = {
  display: "'Inter Tight Variable', 'Inter Variable', system-ui, sans-serif",
  body: "'Inter Variable', system-ui, sans-serif",
  /** Occurrence numbers are read over radio and written on paper: slashed
   *  zero, unambiguous 1/l/I. */
  data: "'JetBrains Mono Variable', ui-monospace, monospace",
  scale: {
    caption: "0.875rem", // 14px — Desk only; Field floor is 16px
    body: "1.0625rem", // 17px
    bodyLg: "1.125rem", // 18px
    h3: "1.3125rem", // 21px
    h2: "1.6875rem", // 27px
    h1: "2.125rem", // 34px
    display: "2.625rem", // 42px
  },
} as const;

/** Emit a theme as CSS custom property declarations (used by the root layout). */
export function themeToCssVars(theme: ThemeTokens): string {
  return Object.entries(theme)
    .map(([key, value]) => {
      const kebab = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      return `--sn-${kebab}: ${value};`;
    })
    .join("\n");
}
