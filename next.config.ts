/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable browser source maps for production builds
  productionBrowserSourceMaps: false,

  // Let Next compile the workspace package from source consistently
  transpilePackages: ["@captify/core", "@captify/mi"],

  // Disable image optimization for Amplify compatibility
  images: {
    unoptimized: true,
  },

  // Force dynamic rendering for all pages to prevent SSR hook issues
  async rewrites() {
    return [];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer, dev }) => {
    // Only apply webpack config when not using turbopack
    if (process.env.NODE_ENV === "production") {
      // Ensure consistent React resolution across monorepo
      const path = require("path");
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        "@": path.resolve(__dirname, "src"),
        // Force single React instance across monorepo
        react: path.resolve(__dirname, "node_modules/react"),
        "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      };

      // Optimize for Amplify build environment
      if (!dev && !isServer) {
        // Reduce bundle size for Amplify's 50MB limit
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: "all",
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: "vendors",
                chunks: "all",
                maxSize: 244000, // ~240KB chunks
              },
            },
          },
        };
      }
    }

    return config;
  },

  // Ensure proper output configuration for Amplify
  trailingSlash: false,

  turbopack: {
    resolveAlias: {
      "@": "./src",
      // ❌ Do NOT alias react/react-dom here; use pnpm overrides instead.
    },
  },
};

export default nextConfig;
