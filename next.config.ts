/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // Let Next compile the workspace package from source consistently
  transpilePackages: ["@captify/core"],

  images: { unoptimized: true },

  experimental: {
    // Avoid optimizing internal workspace package imports until the package is fully ESM + side-effect-free
    // optimizePackageImports: [], // ← remove @captify/core here
  },

  webpack: (config, { isServer, dev }) => {
    // Keep your alias for "@" (fine), but do NOT alias @captify/core to dist anywhere
    const path = require("path");
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
    };

    // Dev-only watch tweaks are fine; they won’t affect prod build
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**"],
        poll: 1000,
        aggregateTimeout: 100,
      };
    }

    return config;
  },

  // DO NOT alias @captify/core to dist here — it causes dev/prod divergence
  turbopack: {
    resolveAlias: {
      // "@captify/core": "./packages/core/dist", // ❌ remove this
    },
  },
};

export default nextConfig;
