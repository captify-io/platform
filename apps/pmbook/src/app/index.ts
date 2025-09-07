"use client";

/**
 * @captify/pmbook/app - App configuration and registry
 *
 * This module provides page registry configuration for dynamic loading.
 */

// Export page registry with dynamic imports
export const pageRegistry = {
  // Main dashboard/home
  home: () => import("./pages/command-center/CommandCenter"),
  dashboard: () => import("./pages/command-center/CommandCenter"),
  
  // Main section pages matching menu.json structure
  "command-center": () => import("./pages/command-center/CommandCenter"),
  work: () => import("./pages/work/WorkDashboard"), 
  contracts: () => import("./pages/contracts/ContractsPage"),
  services: () => import("./pages/services/ServicesHub"),
  strategic: () => import("./pages/strategic/StrategicPage"),
  performance: () => import("./pages/performance/PerformancePage"),
  intelligence: () => import("./pages/intelligence/IntelligencePage"),
  
  // Sub-page routes for work management
  "work-queue": () => import("./pages/work/WorkDashboard"),
  "work-tracking": () => import("./pages/work/WorkDashboard"),
  "work-reports": () => import("./pages/work/WorkDashboard"),
  
  // Sub-page routes for contract management
  "contracts-active": () => import("./pages/contracts/ContractsPage"),
  "contracts-cdrls": () => import("./pages/contracts/ContractsPage"), 
  "contracts-invoices": () => import("./pages/contracts/ContractsPage"),
  "contracts-milestones": () => import("./pages/contracts/ContractsPage"),
  
  // Sub-page routes for services
  "services-tickets": () => import("./pages/services/ServicesHub"),
  "services-marketplace": () => import("./pages/services/ServicesHub"),
  "services-sla": () => import("./pages/services/ServicesHub"),
  
  // Sub-page routes for strategic alignment
  "strategic-objectives": () => import("./pages/strategic/StrategicPage"),
  "strategic-capabilities": () => import("./pages/strategic/StrategicPage"),
  "strategic-alignment": () => import("./pages/strategic/StrategicPage"),
  
  // Sub-page routes for performance analytics
  "performance-health": () => import("./pages/performance/PerformancePage"),
  "performance-burn": () => import("./pages/performance/PerformancePage"),
  "performance-forecasting": () => import("./pages/performance/PerformancePage"),
  
  // Sub-page routes for AI intelligence
  "intelligence-insights": () => import("./pages/intelligence/IntelligencePage"),
  "intelligence-predictions": () => import("./pages/intelligence/IntelligencePage"), 
  "intelligence-recommendations": () => import("./pages/intelligence/IntelligencePage"),
};

// Export component registry with dynamic imports
export const componentRegistry = {
  CommandCenterPage: () => import("./pages/command-center/CommandCenter"),
  WorkDashboardPage: () => import("./pages/work/WorkDashboard"),
  ContractsPage: () => import("./pages/contracts/ContractsPage"),
  ServicesHubPage: () => import("./pages/services/ServicesHub"),
  StrategicPage: () => import("./pages/strategic/StrategicPage"),
  PerformancePage: () => import("./pages/performance/PerformancePage"), 
  IntelligencePage: () => import("./pages/intelligence/IntelligencePage"),
};

// Export pages
export * from "./pages";

// Export client-safe types
export * from "../types";