// next.config.ts  (rename to .ts since you're using types + ESM export)
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  generateEtags: false,
  compress: true,

  // Compile monorepo packages from source (dev & prod)
  transpilePackages: ["@captify/client", "@captify/api", "@captify/veripicks"],

  // TEMP: uncomment while debugging the "C is not a function" to get readable stacks
  // swcMinify: false,

  webpack: (config, { isServer }) => {
    // Align the "@" alias for webpack builds too
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
      // IMPORTANT: do NOT alias @captify/core here; let Node resolve via package.json "exports"
    };

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

    // Externalize large server-only libs
    if (isServer) {
      const externals = config.externals || [];
      const shouldExternalize = (m: string) =>
        m.startsWith("@aws-sdk/") ||
        m === "aws-sdk" ||
        m === "next-auth" ||
        m.startsWith("next-auth/");

      config.externals = [
        ...externals,
        (
          { request }: { request?: string },
          cb: (err?: Error | null, res?: string) => void
        ) => {
          if (request && shouldExternalize(request))
            return cb(null, `commonjs ${request}`);
          cb();
        },
        {
          "@aws-sdk/client-dynamodb": "commonjs @aws-sdk/client-dynamodb",
          "@aws-sdk/util-dynamodb": "commonjs @aws-sdk/util-dynamodb",
          "@aws-sdk/client-bedrock-agent-runtime":
            "commonjs @aws-sdk/client-bedrock-agent-runtime",
          "@aws-sdk/client-bedrock-runtime":
            "commonjs @aws-sdk/client-bedrock-runtime",
          "@aws-sdk/client-cognito-identity-provider":
            "commonjs @aws-sdk/client-cognito-identity-provider",
          "@aws-sdk/credential-providers":
            "commonjs @aws-sdk/credential-providers",
          "@aws-sdk/client-s3": "commonjs @aws-sdk/client-s3",
          "@aws-sdk/lib-dynamodb": "commonjs @aws-sdk/lib-dynamodb",
          "next-auth": "commonjs next-auth",
          "next-auth/next": "commonjs next-auth/next",
          "next-auth/providers/cognito": "commonjs next-auth/providers/cognito",
        },
      ];
    }

    // Bundle analyzer (optional)
    if (process.env.ANALYZE === "true") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const withAnalyzer = require("@next/bundle-analyzer");
      config.plugins.push(new (withAnalyzer({ enabled: true }))());
    }

    return config;
  },

  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 86400,
  },

  env: {
    REGION: process.env.REGION || "us-east-1",
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },

  // Turbopack tweaks
  turbopack: {
    rules: {
      "*.svg": { loaders: ["@svgr/webpack"], as: "*.js" },
    },
    resolveAlias: {
      "@": "./src",
      // IMPORTANT: remove the @captify/core aliases here too
      // "@captify/core": "./packages/core/src",
      // "@captify/core/chat": "./packages/core/src/chat",
    },
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    optimisticClientCache: true,
    serverMinification: true,
    esmExternals: true,
  },
};

export default nextConfig;
