/**
 * Application management types
 */

import { Core } from "@captify/core/types";

// ===== APPLICATION MANAGEMENT =====
// App interface for managing all applications in the platform

export interface App extends Core {
  version: string;
  status: "active" | "inactive" | "maintenance" | "deprecated";
  category: string; // e.g., "administration", "analytics", "compliance"
  visibility: "public" | "internal" | "private";
  icon: string; // Icon identifier for UI
  enabled?: boolean; // Whether the application is enabled
  menu: Array<{
    id: string;
    label: string;
    href: string;
    icon: string;
    order: number;
    children?: Array<{
      id: string;
      label: string;
      href: string;
      icon: string;
      order: number;
    }>;
  }>;
  agentId?: string; // AWS Bedrock Agent ID if applicable
  agentAliasId?: string; // AWS Bedrock Agent Alias ID if applicable,
  identityPoolId?: string;
}

export type AppCategory =
  | "security"
  | "productivity"
  | "analytics"
  | "communication"
  | "finance"
  | "hr"
  | "marketing"
  | "sales"
  | "support"
  | "development"
  | "other";

export type AppStatus = "active" | "inactive" | "development" | "archived";
export type AppVisibility = "public" | "internal" | "private";

export const APP_CATEGORY_LABELS: Record<AppCategory, string> = {
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

// ===== USER ACCESS MANAGEMENT =====

export interface UserApp extends Core {
  userId: string; // Cognito user ID
  appId: string; // App ID
  roleId: string; // Role ID for this user in this app
  grantedBy: string; // User ID who granted access
  expiresAt?: string; // Optional expiration timestamp
  status: "active" | "suspended" | "expired" | "revoked";
}

export interface AppAccessRequest extends Core {
  userId: string; // User requesting access
  appId: string; // App being requested
  requestedRole?: string; // Specific role requested (optional)
  justification: string; // Business justification
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewedBy?: string; // User ID who reviewed
  reviewNotes?: string; // Notes from reviewer
}

export interface AppRole extends Core {
  appId: string; // App this role belongs to
  permissions: string[]; // Simple array of permission keys
  dataAccess: "none" | "own" | "team" | "all";
  isDefault?: boolean; // Is this the default role for new users
  isAdmin?: boolean; // Is this an admin role
}

// Simplified access profile for users
export interface UserAccessProfile {
  userId: string;
  appId: string;
  roles: string[]; // Role IDs
  permissions: string[]; // Merged permissions from all roles
  dataAccess: "none" | "own" | "team" | "all";
  expiresAt?: string;
}

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
