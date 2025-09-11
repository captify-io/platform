// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,

  // Make sure Next compiles your workspace packages
  transpilePackages: ["@captify-io/*"],

  webpack: (config) => {

    // Your aliases (kept as-is)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@captify-io/platform/hooks": require.resolve("./src/hooks/index.ts"),
      "@captify-io/platform/ui": require.resolve(
        "./src/components/ui/index.ts"
      ),
      "@captify-io/platform/api": require.resolve("./src/lib/api.ts"),
      "@captify-io/platform/utils": require.resolve("./src/lib/utils.ts"),
      "@captify-io/platform/types": require.resolve("./src/types/index.ts"),
      "@captify-io/platform/auth": require.resolve("./src/lib/auth.ts"),
      "@captify-io/platform/components": require.resolve(
        "./src/components/index.ts"
      ),
      "@captify-io/platform/lib": require.resolve("./src/lib/index.ts"),
      "@captify-io/platform/theme": require.resolve(
        "./src/components/theme/index.ts"
      ),
      // Fix broken pmbook package exports
      "@captify-io/pmbook": require.resolve("./node_modules/@captify-io/pmbook/dist/index.js"),
      "@captify-io/pmbook/app": require.resolve("./node_modules/@captify-io/pmbook/dist/index.js"),
    };

    // Optional: reduce noise, but don’t hide real bundling errors
    config.ignoreWarnings = [/Failed to parse source map/];

    return config;
  },

  turbopack: {
    rules: {
      "*.svg": { loaders: ["@svgr/webpack"], as: "*.js" },
    },
  },
};

export default nextConfig;
