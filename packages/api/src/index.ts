// ⚠️ Server-side only exports - use only in API routes and server-side code
export { CaptifyApi, captifyApi, createCaptifyApi } from "./CaptifyApi";

// Alias for backward compatibility and convenience
export { captifyApi as apiClient } from "./CaptifyApi";

// Session service for authentication
export { SessionService } from "./SessionService";

// Service operation discovery functions
export { getOps as getDynamoOps } from "./services/dynamo";
export { getOps as getS3Ops } from "./services/s3";
export { getOps as getChatOps } from "./services/chat";
export { getOps as getNeptuneOps } from "./services/neptune";

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

// Re-export NextAuth and related providers for auth routes
export { default as NextAuth } from "next-auth/next";
export { default as CognitoProvider } from "next-auth/providers/cognito";
export { getServerSession } from "next-auth/next";

// 🔐 Auth Route Handlers - for use in app/api/auth route files
export {
  nextAuthGET,
  nextAuthPOST,
  cognitoIdentityHandler,
  clientInfoHandler,
  validateSessionHandler,
  validateEmailHandler,
  saveEmailHandler,
  getSecureStorageHandler,
  setSecureStorageHandler,
  deleteSecureStorageHandler,
  setLoginHintHandler,
  signinWithHintHandler,
  cognitoAuthHandler,
} from "./handlers/auth";

// 🚀 Manifest System - for dynamic routing
export { authManifest, apiManifest, manifests } from "./api.manifest";
export type {
  RouteHandler,
  ManifestRoute,
  ApplicationManifest,
} from "./api.manifest";

export { organizationService } from "./lib/organization";

// ✅ Client-side API moved to @captify/client package
// Use: import { CaptifyClient } from "@captify/client"

// Export all types from the consolidated types file
export type {
  // Core API Configuration
  ApiConfig,
  ApiClientConfig,

  // Session types for API package
  ApiUserSession,

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
