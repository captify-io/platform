/**
 * Captify Server Context
 * NIST 800-53 & CSF 5.0 aligned context for API request handling
 *
 * Provides user identity, tenant info, RBAC, and audit correlation.
 * This mirrors the client-side CaptifyContext (in @captify/client),
 * but is designed for API/server usage without React or browser crypto.
 */

export interface CaptifyServerUser {
  id: string;
  email: string;
  roles: string[];
  orgId?: string;
}

export interface CaptifyServerContext {
  user?: CaptifyServerUser;
  tenantId?: string;
  requestId: string; // unique per request (for tracing)
  timestamp: string; // ISO timestamp of request
}
