import { Core } from "./core";

/**
 * Tenant represents an organization in the system
 */
export interface Tenant extends Core {
  code: string; // Unique tenant code (e.g., "ACME", "TECH")
  name: string; // Full organization name
  domain?: string; // Email domain for auto-assignment (e.g., "@acme.com")
  status: "active" | "inactive" | "suspended";
  settings: {
    maxUsers?: number;
    allowSelfRegistration: boolean;
    requireApproval: boolean;
    defaultUserRole?: string;
  };
  contact: {
    primaryEmail?: string;
    primaryPhone?: string;
    address?: string;
  };
  metadata?: {
    industry?: string;
    size?: string;
    created?: string;
  };
}