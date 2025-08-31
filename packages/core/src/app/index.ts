/**
 * @captify/core/app - Client-side exports
 *
 * Contains all client-safe functionality including React components,
 * hooks, and utilities that can run in the browser.
 */

// Re-export types only to avoid pulling in React components in the main bundle
export type { CoreAppProps } from "./CoreApp";

// Export page registry for dynamic loading
export const pages = {
  home: () => import("./page"),
  dashboard: () => import("./page"),
  core: () => import("./CoreApp"),
  // Main section pages
  policies: () => import("./pages/PoliciesPage"),
  access: () => import("./pages/AccessPage"),
  services: () => import("./pages/ServicesPage"),
  organizations: () => import("./page"), // Using default page for now
  settings: () => import("./page"), // Using default page for now
  monitor: () => import("./pages/MonitorPage"),
  // Sub-page routes (using dash notation from navigation)
  "policies-ssp": () => import("./pages/PoliciesPage"), // Will show SSP section
  "policies-poams": () => import("./pages/PoliciesPage"), // Will show POA&Ms section
  "policies-change-requests": () => import("./pages/PoliciesPage"), // Will show Change Requests section
  "policies-sops": () => import("./pages/PoliciesPage"), // Will show SOPs section
  "policies-risk-assessments": () => import("./pages/PoliciesPage"), // Will show Risk Assessments section
  "policies-compliance": () => import("./pages/PoliciesPage"), // Will show Compliance section
  "access-users": () => import("./pages/AccessPage"), // Will show User Management section
  "access-roles": () => import("./pages/AccessPage"), // Will show Role Management section
  "access-policies": () => import("./pages/AccessPage"), // Will show Policy Management section
  "access-reviews": () => import("./pages/AccessPage"), // Will show Access Reviews section
  "access-provisioning": () => import("./pages/AccessPage"), // Will show Provisioning section
  "services-dynamodb": () => import("./pages/ServicesPage"), // Will show DynamoDB section
  "services-neptune": () => import("./pages/ServicesPage"), // Will show Neptune section
  "services-s3": () => import("./pages/ServicesPage"), // Will show S3 section
  "services-bedrock": () => import("./pages/ServicesPage"), // Will show Bedrock section
  "services-agents": () => import("./pages/ServicesPage"), // Will show Agents section
  "services-lambda": () => import("./pages/ServicesPage"), // Will show Lambda section
  "settings-themes": () => import("./page"), // Using default page for now
  "settings-notifications": () => import("./page"), // Using default page for now
  "settings-integrations": () => import("./page"), // Using default page for now
  "settings-system": () => import("./page"), // Using default page for now
  "monitor-performance": () => import("./pages/MonitorPage"), // Will show Performance section
  "monitor-audit": () => import("./pages/MonitorPage"), // Will show Audit Logs section
  "monitor-alerts": () => import("./pages/MonitorPage"), // Will show Alerts section
  "monitor-security": () => import("./pages/MonitorPage"), // Will show Security Events section
};

// Export component registry
export const components = {
  CoreDashboardPage: () => import("./page"),
  CoreApp: () => import("./CoreApp"),
};

// Export client-safe types
export type { CoreUser, CoreResponse } from "../types";
