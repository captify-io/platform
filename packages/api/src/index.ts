// ⚠️ Server-side only exports - use only in API routes and server-side code
export { CaptifyApi, captifyApi, createCaptifyApi } from "./CaptifyApi";
export { DynamoDBServiceAPI } from "./services/DynamoDBServiceAPI";
export { S3ServiceAPI } from "./services/S3ServiceAPI";
export { SessionService } from "./SessionService";

// 📁 Library exports - authentication, session, and organization utilities
export {
  getUserSession,
  requireUserSession,
  hasPermission,
  validateOrgAccess,
  getAccessibleOrgs,
  getSessionContext,
} from "./lib/session";

export {
  authOptions,
  getExtendedServerSession,
  validateServerSession,
} from "./lib/auth";

export { organizationService } from "./lib/organization";

// Re-export UserSession from core for API route convenience
export type { UserSession } from "@captify/core";

// 🚫 Internal AWS services - not for export (use via ServiceAPIs)
// export { AwsClientFactory } from "./aws/client-factory";
// export { DynamoDBService } from "./aws/dynamodb";

// ✅ Client-side API moved to @captify/core package
// Use: import { CaptifyClient } from "@captify/core"

// Export all types from the consolidated types file
export type {
  // Core API Configuration
  ApiConfig,
  ApiClientConfig,

  // Extended session type for API package
  ExtendedUserSession,

  // AWS Infrastructure Types
  AwsCredentials,
  AwsClientConfig,
  DatabaseClientOptions,
  DynamoDbOptions,

  // API Request/Response Types
  ApiRequest,
  ApiResponse,

  // Resource and Service Types
  AwsService,

  // Event System Types
  ApiEvent,
  EventHandler,

  // Service Registry Types
  ServiceRegistry,

  // Provider Abstractions
  DatabaseProvider,
  CacheProvider,

  // Auth Types
  ExtendedToken,
  AuthAccount,
  AuthProfile,
  ExtendedSession,
  AuthUser,
} from "./types";
