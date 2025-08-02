import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure for production
  poweredByHeader: false,
  generateEtags: false,

  // Environment variables for AWS services
  env: {
    AWS_REGION: process.env.AWS_REGION || "us-east-1",
  },
};

export default nextConfig;
