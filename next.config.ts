import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure for production
  poweredByHeader: false,
  generateEtags: false,

  // Environment variables for AWS services
  env: {
    REGION: process.env.REGION || "us-east-1",
  },
};

export default nextConfig;
