/**
 * App configuration and metadata for Materiel Insights
 */

import { App } from "@captify/core";

export interface MaterielInsightsApp extends App {
  category: "analytics";
  visibility: "internal";
  icon: "airplane";
}

// Menu structure for the MI application
export const MI_APP_MENU = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/mi/dashboard",
    icon: "dashboard",
    order: 1,
  },
  {
    id: "materials",
    label: "Materials",
    href: "#",
    icon: "package",
    order: 2,
    children: [
      {
        id: "bom",
        label: "Bill of Materials",
        href: "/mi/bom",
        icon: "list",
        order: 1,
      },
      {
        id: "assemblies",
        label: "Assemblies",
        href: "/mi/assemblies",
        icon: "component",
        order: 2,
      },
      {
        id: "structures",
        label: "Structures",
        href: "/mi/structures",
        icon: "building",
        order: 3,
      },
      {
        id: "problem-parts",
        label: "Problem Parts",
        href: "/mi/problem-parts",
        icon: "alert-triangle",
        order: 4,
      },
    ],
  },
  {
    id: "engineering",
    label: "Engineering",
    href: "#",
    icon: "wrench",
    order: 3,
    children: [
      {
        id: "engineering-requests",
        label: "Engineering Requests",
        href: "/mi/engineering-requests",
        icon: "file-edit",
        order: 1,
      },
      {
        id: "problem-reports",
        label: "Problem Reports",
        href: "/mi/problem-reports",
        icon: "bug",
        order: 2,
      },
      {
        id: "config-management",
        label: "Configuration Management",
        href: "/mi/config-management",
        icon: "settings",
        order: 3,
      },
    ],
  },
  {
    id: "planning",
    label: "Planning",
    href: "#",
    icon: "calendar",
    order: 4,
    children: [
      {
        id: "forecasting",
        label: "Advanced Forecasting",
        href: "/mi/forecasting",
        icon: "trending-up",
        order: 1,
      },
      {
        id: "maintenance",
        label: "Maintenance Planning",
        href: "/mi/maintenance",
        icon: "tool",
        order: 2,
      },
      {
        id: "supply-chain",
        label: "Supply Chain",
        href: "/mi/supply-chain",
        icon: "truck",
        order: 3,
      },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    href: "/mi/compliance",
    icon: "shield-check",
    order: 5,
  },
] as const;
