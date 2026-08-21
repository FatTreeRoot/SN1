import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit ships font metrics as data files; bundling loses them, so it
  // stays a runtime require from node_modules.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
