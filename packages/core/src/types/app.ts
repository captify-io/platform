/**
 * Application management types
 */

import { Core } from "./core";

// ===== APPLICATION MANAGEMENT =====
// App interface for managing all applications in the platform

export interface App extends Core {
  version: string;
  status: "active" | "inactive" | "maintenance" | "deprecated";
  category: string; // e.g., "administration", "analytics", "compliance"
  visibility: "public" | "internal" | "private";
  icon: string; // Icon identifier for UI
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
  identityPoolId: string;
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
  hr: "Human Resources",
  marketing: "Marketing",
  sales: "Sales",
  support: "Support",
  development: "Development",
  other: "Other",
};
