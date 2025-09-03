/** @type {import('next').NextConfig} */

const nextConfig = {
  // Enable React strict mode for highlighting potential problems
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // Transpile packages (Next.js 15+ feature for workspace packages)
  transpilePackages: ["@captify/core"],

  // Disable server-side features for client-only mode
  images: {
    unoptimized: true,
  },

  // Enable experimental features for better package watching
  experimental: {
    // Enable optimized package imports and watching
    optimizePackageImports: ["@captify/core"],
  },

  // Configure webpack for proper package watching
  webpack: (config, { isServer, dev }) => {
    if (dev && !isServer) {
      // Configure file watching to include package dist folders
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "!**/packages/core/dist/**", // Watch the core package dist
        ],
        poll: 1000, // Use polling for reliable file watching on Windows
        aggregateTimeout: 100, // Shorter timeout for faster rebuilds
      };

      // Add package dist directory as a dependency to trigger rebuilds
      const path = require("path");
      const packageDistPath = path.resolve(process.cwd(), "packages/core/dist");
      config.resolve.alias["@"] = path.resolve(__dirname, "src");
      config.plugins.push({
        apply(compiler) {
          compiler.hooks.afterCompile.tap("PackageWatcher", (compilation) => {
            // Add the entire package dist directory as a dependency
            compilation.contextDependencies.add(packageDistPath);
          });
        },
      });
    }

    return config;
  },

  // Configure turbopack for proper package watching (equivalent to webpack config above)
  turbopack: {
    resolveAlias: {
      // Ensure proper resolution of workspace packages
      "@captify/core": "./packages/core/dist",
    },
  },
};

export default nextConfig;
