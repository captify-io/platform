/**
 * @captify/admin/app - App configuration and registry
 *
 * This module provides page registry configuration for dynamic loading.
 */

// Export page registry with dynamic imports
export const pageRegistry = {
  home: () => import("./pages/dashboard"),
  dashboard: () => import("./pages/dashboard"),
  // Main section pages
  policies: () => import("./pages/policies"),
  access: () => import("./pages/access"),
  services: () => import("./pages/services"),
  organizations: () => import("./pages/dashboard"),
  settings: () => import("./pages/dashboard"),
  monitor: () => import("./pages/monitor/page"),
  // Application access management pages
  applications: () => import("./pages/applications"),
  "my-apps": () => import("./pages/applications/my-apps"),
  "access-admin": () => import("./pages/access/admin"),
  "access-users": () => import("./pages/access/users"),
  // Sub-page routes (using dash notation from navigation)
  "access-pools": () => import("./pages/access/pools"),
  "access-policies": () => import("./pages/access"),
  "services-dynamodb": () => import("./pages/services"),
  "services-neptune": () => import("./pages/services"),
  "services-s3": () => import("./pages/services"),
  "services-bedrock": () => import("./pages/services"),
  "services-agents": () => import("./pages/services"),
  "services-lambda": () => import("./pages/services"),
  "settings-themes": () => import("./pages/dashboard"),
  "settings-notifications": () => import("./pages/dashboard"),
  "settings-integrations": () => import("./pages/dashboard"),
  "settings-system": () => import("./pages/dashboard"),
  "monitor-performance": () => import("./pages/monitor/page"),
  "monitor-audit": () => import("./pages/monitor/page"),
  "monitor-alerts": () => import("./pages/monitor/page"),
  "monitor-security": () => import("./pages/monitor/page"),
};

// Export component registry with dynamic imports
export const componentRegistry = {
  CoreDashboardPage: () => import("./pages/dashboard"),
};

// Export client-safe types
export * from "../types";
