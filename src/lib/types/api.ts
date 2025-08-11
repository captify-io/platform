/**
 * Standard API Response Types
 *
 * Consistent response structure across all API endpoints.
 * Ensures uniform error handling and response formatting.
 */

/**
 * Standard API response wrapper
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<TData = any> {
  data?: TData;
  error?: string;
  meta?: ApiResponseMeta;
}

/**
 * Response metadata
 */
export interface ApiResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
  total?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Standard error response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
  meta: ApiResponseMeta;
}

/**
 * Request validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Session information included in API responses
 */
export interface SessionInfo {
  user_id: string;
  email?: string;
  expires_at?: string;
}

/**
 * Helper function to create successful API response
 */
export function createApiResponse<T>(
  data: T,
  meta?: Partial<ApiResponseMeta>
): ApiResponse<T> {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Helper function to create error API response
 */
export function createApiError(
  error: string,
  code?: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    error,
    code,
    details,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * HTTP status codes for consistent API responses
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
} as const;
