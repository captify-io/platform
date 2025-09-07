/**
 * Core package type definitions
 *
 * Core-specific types only. Framework types are in root.
 */

// Application management types
export * from "./app";

// User and organization management
export * from "./user";

// Access management and security
export * from "./access";

// Compliance and risk management
export * from "./compliance";

// Services and integrations
export * from "./services";

// Monitoring types
export * from "./monitor";

// Re-export types that services need
export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export interface ApiUserSession {
  user: any;
  expires: string;
}

export interface Tenant {
  id: string;
  name: string;
  identityPoolId?: string;
}
