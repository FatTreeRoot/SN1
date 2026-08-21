import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/inter-tight";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { identity, recordTypeCssVars, themes, themeToCssVars } from "@/config/branding";

/*
 * All --sn-* custom properties are emitted here from config/branding.ts —
 * the single place identity lives. Themes apply wherever data-theme is set,
 * so a container can host the opposite theme (used by the design demo page).
 */
const tokensCss = `
:root, [data-theme="light"] {
${themeToCssVars(themes.light)}
${recordTypeCssVars("light")}
}
[data-theme="dark"] {
${themeToCssVars(themes.dark)}
${recordTypeCssVars("dark")}
}
`;

/*
 * Sets the theme before first paint so a patroller opening the app at night
 * never sees a white flash. Reads the stored choice, falls back to the
 * surface default (data-default-theme, set per route group), then system.
 * TODO(security checkpoint): serve under a nonce-based CSP.
 */
const themeInitJs = `
(function () {
  var root = document.documentElement;
  try {
    var t = localStorage.getItem("sn-theme");
    if (t !== "light" && t !== "dark") {
      t = root.getAttribute("data-default-theme");
      if (t === "system" || !t) {
        t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
    }
    root.setAttribute("data-theme", t);
  } catch (e) {
    root.setAttribute("data-theme", "light");
  }
})();
`;

export const metadata: Metadata = {
  title: identity.appName,
  description: `${identity.nation} ${identity.department} records`,
  applicationName: identity.appName,
  icons: {
    icon: "/brand/logo-compact.png",
    apple: "/brand/logo-compact.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: themes.light.bg },
    { media: "(prefers-color-scheme: dark)", color: themes.dark.bg },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <style id="sn-tokens" dangerouslySetInnerHTML={{ __html: tokensCss }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitJs }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink">{children}</body>
    </html>
  );
}
