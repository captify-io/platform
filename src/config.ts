import type { CaptifyLayoutConfig } from "@captify-io/core";

/**
 * Platform Configuration
 *
 * Platform provides authentication, AWS service proxy, and core management features.
 * These menu items are available across all applications in the platform.
 */

export const config: CaptifyLayoutConfig = {
  slug: "platform",
  appName: "Platform",
  version: "1.0.0",
  description: "Authentication and service platform",

  // No menu items - rely on core menu
  menu: [],

  // Platform configuration
  platform: {
    url:
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://www.captify.io",
  },
};

export const { slug, description, menu, appName, version } = config;
export default config;
