/**
 * Core package type definitions
 */

export interface CoreUser {
  id: string;
  email: string;
  name: string;
}

export interface CoreResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// AWS Credentials interface for S3 operations
export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

// API User Session interface for S3 operations
export interface ApiUserSession {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: "admin" | "user" | "viewer";
  status: "active" | "inactive" | "pending";
  createdAt: string;
  lastLogin?: string;
}

// Menu Structure Types
export interface MenuItemBase {
  id: string;
  title: string;
  icon: string;
}

export interface MenuPage extends MenuItemBase {
  type: "page";
  route: string;
}

export interface MenuSection extends MenuItemBase {
  type: "section";
  items: MenuPage[];
}

export type MenuItem = MenuPage | MenuSection;

export interface MenuStructure {
  title: string;
  version: string;
  sections: MenuItem[];
}

export interface MenuMetadata {
  packageName: string;
  version: string;
  lastUpdated: string;
  installer: {
    tableName: string;
    partitionKey: string;
    sortKey: string;
    configType: string;
  };
}

export interface CoreMenuConfig {
  menuStructure: MenuStructure;
  metadata: MenuMetadata;
}
