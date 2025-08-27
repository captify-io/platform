/**
 * Core Package Types
 * All type definitions for the @captify/client package
 * Shared utilities and configuration types
 */

// Core Configuration Types
import { UUID } from "crypto";
export interface CaptifyConfig {
  aws: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    userPoolId: string;
    userPoolClientId: string;
    identityPoolId: string;
  };
  database: {
    dynamoTablePrefix?: string;
    applicationsTable?: string;
    userStateTable?: string;
    organizationSettingsTable?: string;
    menuItemsTable?: string;
    workspaceContentTable?: string;
    chatTable?: string;
    agentsTable?: string;
    agentJobsTable?: string;
  };
  agents: {
    bedrockRegion?: string;
    bedrockAgentId?: string;
    bedrockAgentAliasId?: string;
  };
  storage: {
    s3Bucket?: string;
    s3Region?: string;
  };
  api: {
    gatewayUrl?: string;
  };
  nextAuth: {
    url: string;
    secret: string;
  };
  cognito: {
    clientSecret: string;
    domain: string;
  };
}

export interface User {
  userId: UUID;
  email: string;
  name?: string;
  orgId?: string;
  appId?: string;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "pending" | "suspended";
  role: "admin" | "member" | "viewer";
}

export interface UserRole {
  roleId: UUID;
  name: string;
  description?: string;
  permissions: string[];
}

export interface UserState {
  userStateId: UUID;
  userId: string;
  organizationId?: string;

  // App-specific state
  favoriteApps?: string[]; // Array of appIds
  pinnedApps?: string[]; // Array of appIds for pinned apps
  appDisplayOrder?: Record<string, number>; // appId -> display order

  // User preferences
  theme?: "light" | "dark" | "auto";
  language?: string;
  timezone?: string;

  // Activity tracking
  lastActiveAt?: Date;
  lastAccessedApps?: Record<string, Date>; // appId -> last accessed timestamp

  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  orgId: UUID;
  name: string;
  displayName: string;
  domain: string;
  status: string;
  subscriptionTier: string;
  settings: {
    maxUsers: number;
    maxApplications: number;
    allowCustomApps: boolean;
    requireApproval: boolean;
  };
}

// Session and Authentication Types
export interface UserSession {
  userId: string;
  email: string;
  orgId?: string;
  appId?: string;
  idToken?: string;
  awsSessionToken?: string;
  awsExpiresAt?: number;
  permissions?: string[];
}

// Missing interfaces for plugin architecture and enhanced security

export interface SessionInfo {
  sessionId: string;
  userId: string;
  authenticationMethod: "cognito" | "oidc" | "api-key";
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: {
    platform?: string;
    browser?: string;
    version?: string;
  };
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  loginTime: string;
  lastActivity: string;
  expiresAt: string;
  refreshable: boolean;
  scopes: string[];
  metadata?: Record<string, any>;
}

// App Management Types (consolidated from @captify/appman)
export interface App {
  // Core identifiers
  appId: UUID;
  slug: string;

  // Basic information
  name: string;
  description?: string;
  icon?: string;
  version: string;
  category: AppCategory;
  status: "active" | "beta" | "comingSoon" | "maintenance";
  visibility: "internal" | "public" | "organization" | "role";

  agentId?: string;
  agentAliasId?: string;
  isPinned?: boolean;
  capabilities?: string[];
  permissions?: string[];

  // Menu/Navigation
  menu?: any[]; // Raw menu data from database

  // Audit fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type AppCategory =
  | "analytics"
  | "productivity"
  | "communication"
  | "development"
  | "finance"
  | "marketing"
  | "sales"
  | "support"
  | "operations"
  | "other";

// Legacy type alias for backward compatibility
export type Application = App;

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
