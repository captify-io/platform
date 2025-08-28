// MINIMAL NEXT CONFIG FOR DEBUGGING
// Previous config removed (dynamic package discovery, externals manipulation, headers, images)
// to isolate persistent JSON.parse failure during build.
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
};

export default nextConfig;
