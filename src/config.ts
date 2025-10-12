import type { CaptifyLayoutConfig } from "@captify-io/core/components";

/**
 * Platform Configuration
 *
 * Platform provides authentication and AWS service proxy.
 * No menu items needed - platform buttons (apps, notifications, user menu)
 * are already provided in CaptifyLayout sidebar for all apps.
 */

export const config: CaptifyLayoutConfig = {
  slug: "platform",
  appName: "Platform",
  version: "1.0.0",
  description: "Authentication and service platform",

  // Empty menu - platform UI elements are in CaptifyLayout by default
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
