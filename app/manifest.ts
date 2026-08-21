import type { MetadataRoute } from "next";
import { appIcon, identity, themes, useSuppliedLogo } from "@/config/branding";

/** Home-screen install manifest. The icon follows the useSuppliedLogo
 *  switch in config/branding.ts: the Nation's circular emblem when it is
 *  on, the neutral placeholder mark when it is off. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: identity.appName,
    short_name: identity.shortName,
    description: `${identity.nation} ${identity.department}`,
    start_url: "/field",
    display: "standalone",
    background_color: themes.light.bg,
    theme_color: themes.light.bg,
    icons: [
      useSuppliedLogo
        ? { src: appIcon, sizes: "447x447", type: "image/png", purpose: "any" as const }
        : { src: appIcon, sizes: "any", type: "image/svg+xml", purpose: "any" as const },
    ],
  };
}
