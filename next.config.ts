import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  poweredByHeader: false,
  generateEtags: false,
  compress: true,

  // Static optimization for better performance
  // output: "standalone", // Temporarily disabled due to Windows symlink issues

  // Let packages manage their own dependencies - bundle everything for better isolation
  // serverExternalPackages: [
  //   "@aws-sdk/*",
  // ],

  // Webpack configuration to handle Node.js modules
  webpack: (config: any, { isServer }: any) => {
    // Add fallbacks for Node.js modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Bundle analyzer (optional, for debugging)
    if (process.env.ANALYZE === "true") {
      config.plugins.push(
        new (require("@next/bundle-analyzer"))({
          enabled: true,
        })
      );
    }

    return config;
  },

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 86400, // 24 hours
  },

  // Environment variables for AWS services
  env: {
    REGION: process.env.REGION || "us-east-1",
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },

  // Turbopack configuration (now stable)
  turbopack: {
    rules: {
      // Optimize common file types
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
    // Resolve alias for Turbopack
    resolveAlias: {
      "@": "./src",
      "@captify/core": "./packages/core/src",
      "@captify/api": "./packages/api/src",
      "@captify/core/chat": "./packages/core/src/chat",
    },
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    // Other performance optimizations
    optimisticClientCache: true,
    serverMinification: true,
    // Modern bundling optimizations
    esmExternals: true,
  },
};

export default nextConfig;
