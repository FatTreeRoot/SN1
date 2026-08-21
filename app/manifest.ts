import type { MetadataRoute } from "next";
import { identity, themes } from "@/config/branding";

/** Home-screen install manifest. The icon is a neutral placeholder
 *  (horizon bands — landscape abstraction, no cultural motifs); the
 *  Nation's real mark drops in via docs/BRANDING.md. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: identity.appName,
    short_name: identity.shortName,
    description: `${identity.nation} ${identity.department}`,
    start_url: "/field",
    display: "standalone",
    background_color: themes.dark.bg,
    theme_color: themes.dark.bg,
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
