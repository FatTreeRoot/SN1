import type { MetadataRoute } from "next";
import { identity, themes } from "@/config/branding";

/** Home-screen install manifest. The icon is the Nation's circular
 *  emblem, cropped from the supplied logo at the client's direction. */
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
        src: "/brand/logo-compact.png",
        sizes: "447x447",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
