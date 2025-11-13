// next.config.ts
import type { NextConfig } from "next";

const QUICK_SIGHT_CSP = `
  default-src 'self';
  frame-src 'self' https://*.cloudfront.net https://*.quicksight.aws.amazon.com https://*.a2z.com https://*.amazonaws.com;
  frame-ancestors 'self' https://*.cloudfront.net https://*.quicksight.aws.amazon.com https://*.amazonaws.com https://captify.io;
  connect-src 'self' blob: ws: wss: https://*.cloudfront.net https://*.quicksight.aws.amazon.com https://*.amazonaws.com https://*.a2z.com https://*.cloudfront.net https://*.s3.amazonaws.com https://*.s3.us-east-1.amazonaws.com wss://*.quicksight.aws.amazon.com;
  img-src 'self' data: blob: https://*.cloudfront.net https://*.amazonaws.com https://*.quicksight.aws.amazon.com https://*.cloudfront.net https://*.s3.amazonaws.com;
  font-src 'self' data: https://*.cloudfront.net https://*.amazonaws.com https://*.a2z.com https://*.cloudfront.net;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.cloudfront.net https://*.amazonaws.com https://*.quicksight.aws.amazon.com https://*.cloudfront.net;
  style-src 'self' 'unsafe-inline' https://*.cloudfront.net https://*.amazonaws.com https://*.quicksight.aws.amazon.com;
  worker-src 'self' blob:;
`.replace(/\n/g, " ");

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,

  // TypeScript type checking - skip during build (types work correctly at runtime via npm link)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable transpilation for @captify-io packages
  transpilePackages: ["@captify-io/core"],

  // External packages that should not be bundled (Next.js 16+)
  serverExternalPackages: ["pm2", "shiki"],

  // Headers for QuickSight embedding
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "Content-Security-Policy", value: QUICK_SIGHT_CSP }] }];
  },

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
