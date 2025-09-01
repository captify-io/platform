/**
 * Core UI Constants and Types
 * Shared across all client components
 */

import type { AppCategory } from "../types/app";

// Re-export AppCategory for convenience
export type { AppCategory };

// Category display names for UI
export const APP_CATEGORY_LABELS: Record<string, string> = {
  security: "Security",
  productivity: "Productivity",
  analytics: "Analytics",
  communication: "Communication",
  finance: "Finance",
  hr: "HR",
  marketing: "Marketing",
  sales: "Sales",
  support: "Support",
  development: "Development",
  other: "Other",
};

// Navigation and UI types
export interface ApplicationMenuItem {
  app_id: string;
  menu_item_id: string;
  label: string;
  icon: string;
  href: string;
  order: number;
  parent_id?: string;
  required_permissions?: string[];
  visible_when?: "always" | "admin" | "owner" | "custom";
  custom_visibility_rule?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}
