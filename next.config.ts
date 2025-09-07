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
              captifyPackages: {
                test: /[\\/]packages[\\/]/,
                name: "captify-packages",
                chunks: "all",
                priority: 10,
                maxSize: 200000, // ~200KB chunks for internal packages
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
    },
  },
};

export default nextConfig;
