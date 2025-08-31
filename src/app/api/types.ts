/**
 * API Package Types
 * All type definitions for the @captify/api package
 * Infrastructure and AWS interface types only
 */

// Core session type - defined locally to avoid client dependencies
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

// Organization type for API package
export interface Organization {
  orgId: string;
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

// Extended session interface for API package with additional properties
export interface ApiUserSession extends UserSession {
  name?: string;
  roles: string[];
  isAdmin: boolean;
}

export interface ApiConfig {
  region: string;
  credentials?: AwsCredentials;
  endpoints?: Record<string, string>;
  tables?: Record<string, string>;
  debug?: boolean;
}

export interface ApiClientConfig {
  region?: string;
  credentials?: AwsCredentials;
  debug?: boolean;
}

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region?: string;
  expiration?: Date;
}

export interface CognitoTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface DynamoItem {
  [key: string]: any;
}

export interface DynamoQueryOptions {
  indexName?: string;
  limit?: number;
  startKey?: Record<string, any>;
  sortDirection?: "asc" | "desc";
  filterExpression?: string;
  expressionAttributeValues?: Record<string, any>;
  expressionAttributeNames?: Record<string, string>;
}

export interface DynamoScanOptions {
  limit?: number;
  startKey?: Record<string, any>;
  filterExpression?: string;
  expressionAttributeValues?: Record<string, any>;
  expressionAttributeNames?: Record<string, string>;
  select?:
    | "ALL_ATTRIBUTES"
    | "ALL_PROJECTED_ATTRIBUTES"
    | "SPECIFIC_ATTRIBUTES"
    | "COUNT";
  projectionExpression?: string;
}

export interface DynamoResponse<T = DynamoItem> {
  items: T[];
  count: number;
  scannedCount?: number;
  lastEvaluatedKey?: Record<string, any>;
  consumedCapacity?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  timestamp?: string;
  requestId?: string;
}

// User management types
export interface User {
  userId: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  orgId?: string;
  status: "active" | "inactive" | "pending" | "suspended";
  roles: string[];
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface CreateUserRequest {
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  orgId?: string;
  roles?: string[];
  sendInvite?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  status?: "active" | "inactive" | "pending" | "suspended";
  roles?: string[];
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface ListUsersRequest {
  orgId?: string;
  status?: string;
  role?: string;
  limit?: number;
  nextToken?: string;
  sortBy?: "email" | "createdAt" | "lastLoginAt";
  sortOrder?: "asc" | "desc";
}

// Application types
export interface Application {
  appId: string;
  name: string;
  displayName: string;
  description?: string;
  orgId: string;
  status: "active" | "inactive" | "development";
  type: "web" | "mobile" | "api" | "service";
  url?: string;
  iconUrl?: string;
  settings: {
    allowPublicAccess: boolean;
    requireApproval: boolean;
    maxUsers?: number;
    features: string[];
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Permission and role types
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  orgId?: string;
}

// Service manifest types
export interface ServiceOperation {
  name: string;
  description: string;
  parameters: Record<string, any>;
  responseType: string;
  requiresAuth: boolean;
  permissions?: string[];
}

export interface ServiceManifest {
  name: string;
  version: string;
  description: string;
  operations: ServiceOperation[];
  execute: (request: any, credentials?: AwsCredentials) => Promise<ApiResponse>;
}

// Route manifest types
export interface RouteDefinition {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  handler: (request: any, context?: any) => Promise<Response>;
  secure?: boolean;
  permissions?: string[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export interface ApiManifest {
  name: string;
  version: string;
  description: string;
  routes: RouteDefinition[];
}

// Error types
export interface ApiError extends Error {
  code: string;
  statusCode: number;
  details?: any;
  requestId?: string;
}

// AWS Infrastructure Types (additional)
export interface AwsClientConfig {
  region: string;
  credentials?: AwsCredentials;
}

export interface DatabaseClientOptions {
  region?: string;
  credentials?: AwsCredentials;
}

export interface DynamoDbOptions {
  tableName: string;
  key?: Record<string, any>;
  item?: Record<string, any>;
  filterExpression?: string;
  expressionAttributeValues?: Record<string, any>;
  indexName?: string;
  limit?: number;
}

// API Request/Response Types (additional)
export interface ApiRequest {
  service: string;
  operation?: string;
  resource?: string;
  table?: string;
  data?: any;
  params?: any;
  userSession?: ApiUserSession;
}

// Resource and Service Types
export interface AwsService {
  name: string;
  createClient(credentials: AwsCredentials, region: string): any;
}

// Event System Types
export interface ApiEvent {
  type: string;
  resource: string;
  action: string;
  data: any;
  userSession?: ApiUserSession;
  timestamp: number;
}

export interface EventHandler {
  eventType: string;
  handle(event: ApiEvent): Promise<void>;
}

// Service Registry Types
export interface ServiceRegistry {
  register<T>(name: string, service: T): void;
  get<T>(name: string): T | undefined;
  has(name: string): boolean;
}

// Provider Abstractions
export interface DatabaseProvider {
  name: string;
  get(table: string, key: Record<string, any>): Promise<any>;
  put(table: string, item: Record<string, any>): Promise<void>;
  update(
    table: string,
    key: Record<string, any>,
    updates: Record<string, any>
  ): Promise<void>;
  delete(table: string, key: Record<string, any>): Promise<void>;
  query(
    table: string,
    keyCondition: string,
    options?: Record<string, any>
  ): Promise<any[]>;
  scan(table: string, options?: Record<string, any>): Promise<any[]>;
}

export interface CacheProvider {
  name: string;
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Extended NextAuth Types
export interface ExtendedToken {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  error?: string;
  // AWS Identity Pool credentials
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsIdentityId?: string;
  awsExpiresAt?: number;
}

export interface AuthAccount {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires?: number;
  providerAccountId?: string;
  provider?: string;
  type?: string;
}

export interface AuthProfile {
  name?: string;
  email?: string;
  picture?: string;
}

export interface ExtendedSession {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
    image?: string;
  };
  // AWS Identity Pool credentials
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsIdentityId?: string;
  awsExpiresAt?: number;
}

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
}

export interface ResourceHandler {
  resourceType: string;
  handle(request: ApiRequest): Promise<ApiResponse>;
  validatePermissions?(
    userSession: ApiUserSession,
    operation: string
  ): Promise<boolean>;
  transformRequest?(request: ApiRequest): Promise<ApiRequest>;
  transformResponse?(response: ApiResponse): Promise<ApiResponse>;
}
