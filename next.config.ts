// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,

  // In a monorepo you’d need this, but since this is a single package, remove it
  // transpilePackages: ["@captify-io/*"],

  webpack: (config) => {
    // Don’t alias to src files — let package.json "exports" handle resolution
    return config;
  },

  turbopack: {
    rules: {
      "*.svg": { loaders: ["@svgr/webpack"], as: "*.js" },
    },
  },
};

export default nextConfig;
