import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  transpilePackages: ["@captify-io/core"],
  webpack: (config) => {
    // Handle dynamic imports for @captify-io/* packages
    config.module.unknownContextCritical = false;
    config.module.exprContextCritical = false;
    
    return config;
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js"
      }
    },
    resolveAlias: {
      "@captify-io/core": "@captify-io/core"
    }
  }
};

export default nextConfig;