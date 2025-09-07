/**
 * @captify/mi/app - Client-side exports
 *
 * Contains all client-safe functionality including React components,
 * hooks, and utilities that can run in the browser.
 */

// Export page registry for dynamic loading
export const pageRegistry = {
  home: () => import("./pages/Dashboard"),
  dashboard: () => import("./pages/Dashboard"),
  // Materials section pages
  bom: () => import("./pages/BOMPage"),
  assemblies: () => import("./pages/AssembliesPage"),
  structures: () => import("./pages/StructuresPage"),
  "problem-parts": () => import("./pages/ProblemPartsPage"),
  // Engineering section pages
  "engineering-requests": () => import("./pages/EngineeringRequestsPage"),
  "problem-reports": () => import("./pages/ProblemReportsPage"),
  "config-management": () => import("./pages/Dashboard"), // Using default page for now
  // Planning section pages
  forecasting: () => import("./pages/ForecastingPage"),
  maintenance: () => import("./pages/MaintenancePage"),
  "supply-chain": () => import("./pages/SupplyChainPage"),
  // Compliance pages
  compliance: () => import("./pages/CompliancePage"),
};

// Export component registry
export const componentRegistry = {
  MIDashboardPage: () => import("./pages/Dashboard"),
  BOMPage: () => import("./pages/BOMPage"),
  EngineeringRequestsPage: () => import("./pages/EngineeringRequestsPage"),
  ProblemReportsPage: () => import("./pages/ProblemReportsPage"),
};

// Export all pages directly as well for backward compatibility
export * from "./pages";

// App configuration
export { MI_APP_MENU, type MaterielInsightsApp } from "../types/app";

// Export client-safe types
export * from "../types";
