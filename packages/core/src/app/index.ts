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
};

// Export component registry
export const components = {
  CoreDashboardPage: () => import("./page"),
  CoreApp: () => import("./CoreApp"),
};

// Export client-safe types
export type { CoreUser, CoreResponse } from "../types";
