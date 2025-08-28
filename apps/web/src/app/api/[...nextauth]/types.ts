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
  applicationId: string;
  baseUrl: string;
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

// AWS Infrastructure Types
export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

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

// API Request/Response Types
export interface ApiRequest {
  service: string;
  operation?: string;
  resource?: string;
  table?: string;
  data?: any;
  params?: any;
  userSession?: ApiUserSession;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    requestId?: string;
    timestamp?: string;
    source?: string;
  };
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
  expires_at?: number;
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
