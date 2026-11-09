import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Permet de lancer un second `next dev` (e2e) à côté du serveur de dev habituel.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
