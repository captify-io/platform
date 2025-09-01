/**
 * User and organization management types
 */

import { Core } from "./core";

// ===== ORGANIZATION & TENANT MANAGEMENT =====

export interface Organization extends Core {
  domain: string; // Primary domain for the organization
  status: "active" | "suspended" | "pending";
  tier: "starter" | "professional" | "enterprise";
  settings: {
    maxUsers: number;
    allowedFeatures: string[];
    customBranding?: {
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  };
  cognitoUserPoolId?: string; // Reference to AWS Cognito User Pool
  cognitoIdentityPoolId?: string; // Reference to AWS Cognito Identity Pool
}

// ===== USER MANAGEMENT =====

export interface User extends Core {
  userId: string; // AWS Cognito User ID (sub claim)
  orgId: string; // Reference to Organization
  email: string;
  username: string;
  profile: {
    firstName?: string;
    lastName?: string;
    title?: string;
    department?: string;
    phone?: string;
  };
  roles: string[]; // Array of role IDs
  groups: string[]; // Array of group IDs
  status: "active" | "inactive" | "pending" | "suspended";
  preferences: {
    theme: "light" | "dark" | "auto";
    notifications: {
      email: boolean;
      inApp: boolean;
      security: boolean;
    };
    dashboard: {
      layout: string;
      widgets: string[];
    };
  };
  lastLoginAt?: string;
}

export interface UserState extends Core {
  userId: string; // Reference to User.userId (AWS Cognito User ID)
  orgId: string; // Reference to Organization
  preferences: {
    theme: "light" | "dark" | "auto";
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      inApp: boolean;
      security: boolean;
      marketing: boolean;
    };
    dashboard: {
      layout: "grid" | "list" | "compact";
      widgets: string[];
      defaultView: string;
    };
    accessibility: {
      highContrast: boolean;
      fontSize: "small" | "medium" | "large";
      reduceMotion: boolean;
    };
  };
  favorites: {
    applications: string[]; // Array of App IDs
    pages: string[]; // Array of page/route identifiers
    searches: string[]; // Array of saved search queries
    reports: string[]; // Array of report IDs
  };
  recentActivity: {
    applications: Array<{
      appId: string;
      lastAccessed: string;
      accessCount: number;
    }>;
    pages: Array<{
      pageId: string;
      lastAccessed: string;
      accessCount: number;
    }>;
  };
  customSettings: Record<string, any>; // Extensible for app-specific user settings
  lastSyncAt: string; // Last time preferences were synchronized
}

export interface Role extends Core {
  orgId: string;
  permissions: string[]; // Array of permission identifiers
  isSystem: boolean; // Whether this is a system-defined role
  status: "active" | "inactive";
}

export interface Group extends Core {
  orgId: string;
  type: "department" | "project" | "security" | "custom";
  parentGroupId?: string; // For hierarchical groups
  members: string[]; // Array of user IDs
  roles: string[]; // Array of role IDs assigned to this group
  status: "active" | "inactive";
}
