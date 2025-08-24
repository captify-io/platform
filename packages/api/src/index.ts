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

// Re-export NextAuth and related providers for auth routes
export { default as NextAuth } from "next-auth/next";
export { default as CognitoProvider } from "next-auth/providers/cognito";
export { getServerSession } from "next-auth/next";

// Re-export AWS SDK utilities for auth routes
export { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
export {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  GetUserCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// Re-export AWS SDK utilities for chat routes
export {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
export {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
export type { QueryCommandOutput } from "@aws-sdk/client-dynamodb";
export { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

export { organizationService } from "./lib/organization";

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
