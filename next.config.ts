// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,

  // Enable transpilation for @captify-io packages
  transpilePackages: ["@captify-io/pmbook"],

  webpack: (config) => {
    // Don't alias to src files — let package.json "exports" handle resolution
    return config;
  },

  turbopack: {
    rules: {
      "*.svg": { loaders: ["@svgr/webpack"], as: "*.js" },
    },
    resolveAlias: {
      "@captify-io/pmbook": "node_modules/@captify-io/pmbook/dist/index.js",
    },
  },
};

export default nextConfig;
