import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  //transpilePackages: ["@captify-io/pmbook"],
  webpack: (config) => {
    // Handle dynamic imports for @captify-io/* packages
    config.module.unknownContextCritical = false;
    config.module.exprContextCritical = false;

    // Exclude non-JS files from @captify-io packages
    config.module.rules.push({
      test: /node_modules\/@captify-io\/.*\.(md|txt)$/,
      type: "asset/source",
    });

    return config;
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
