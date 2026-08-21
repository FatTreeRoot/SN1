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
 * Semantic theme tokens. Both surfaces ship both themes; Field defaults to
 * dark (night shifts — no large light surfaces at 0300), Desk defaults to
 * light and follows system preference.
 */
export const themes = {
  light: {
    bg: palette.sand100,
    surface: palette.sand50,
    raised: "#ffffff",
    ink: palette.charcoal,
    inkMuted: palette.gray600,
    line: "#d9d4cc",
    lineStrong: palette.gray400,
    accent: palette.teal600,
    accentStrong: palette.teal700,
    accentSoft: palette.teal150,
    onAccent: "#ffffff",
    urgent: palette.red600,
    onUrgent: "#ffffff",
    pending: palette.ochre600,
    pendingSoft: "#f4e8d2",
    filed: palette.green600,
    filedSoft: "#ddece3",
  },
  dark: {
    bg: "#12181a",
    surface: "#1a2124",
    raised: "#232b2f",
    ink: "#e8e6e1",
    inkMuted: palette.gray400,
    line: "#2c363a",
    lineStrong: "#465257",
    accent: "#6fb5bd",
    accentStrong: palette.teal300,
    accentSoft: "#1e3a3f",
    onAccent: "#101617",
    urgent: "#e25344",
    onUrgent: "#16090a",
    pending: palette.ochre500,
    pendingSoft: "#33270f",
    filed: "#57a97e",
    filedSoft: "#16281f",
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
