/**
 * Shared types and API interfaces
 */

// ===== SHARED TYPES =====

export interface CoreResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

// AWS Credentials interface for S3 operations (temporary credentials)
export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration?: string;
}

// API User Session interface for authentication
export interface ApiUserSession {
  user: {
    id: string; // Our internal user ID
    userId: string; // Cognito user ID (sub)
    email: string;
    name?: string;
    orgId: string;
    roles: string[];
  };
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number;
}
