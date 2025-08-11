import { getSession } from "next-auth/react";
import { CognitoCredentials } from "./services/cognito-identity";

interface ExtendedSession {
  accessToken?: string;
  idToken?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  };
  // AWS Identity Pool credentials
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsIdentityId?: string;
  awsExpiresAt?: number;
}

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = unknown> {
  credentials: CognitoCredentials | PromiseLike<CognitoCredentials>;
  success: boolean;
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || "";
    this.timeout = config.timeout || 30000; // 30 seconds
    this.retries = config.retries || 1;
  }

  /**
   * Get saved email from session storage
   */
  private async getSavedEmail(): Promise<string | null> {
    try {
      const response = await fetch("/api/auth/save-email");
      const data = await response.json();
      return data.email || null;
    } catch (error) {
      console.debug("No saved email found:", error);
      return null;
    }
  }

  /**
   * Get authentication headers for API requests
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const session = await getSession();
      console.log(
        "🔍 API Client - Full session object:",
        JSON.stringify(session, null, 2)
      );

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Always try to include user email, either from session or saved email
      let userEmail: string | null = null;

      if (session) {
        const extendedSession = session as ExtendedSession;
        console.log("🔍 API Client - AWS fields in session:", {
          hasAwsSessionToken: !!extendedSession.awsSessionToken,
          hasAwsExpiresAt: !!extendedSession.awsExpiresAt,
          awsExpiresAt: extendedSession.awsExpiresAt,
        });

        // Add session data to headers for server-side API routes
        if (extendedSession.accessToken) {
          headers["Authorization"] = `Bearer ${extendedSession.accessToken}`;
        }

        // CRITICAL: Add ID token for Cognito Identity Pool authentication
        // Neptune/AWS services require ID tokens, not access tokens for Identity Pool
        if (extendedSession.idToken) {
          headers["X-ID-Token"] = extendedSession.idToken;
        } else if (
          typeof session === "object" &&
          session !== null &&
          "id_token" in session &&
          typeof (session as { id_token?: string }).id_token === "string"
        ) {
          // Fallback for different session structures
          headers["X-ID-Token"] = (session as { id_token: string }).id_token;
        } else {
          // No ID token found
          console.warn(
            "No ID token found in session - Neptune authentication may fail"
          );
        }

        if (session.user?.email) {
          userEmail = session.user.email;
        }
      }

      // If no email from session, try to get saved email
      if (!userEmail) {
        userEmail = await this.getSavedEmail();
      }

      // Add email to headers if available
      if (userEmail) {
        headers["X-User-Email"] = userEmail;
      }

      // Add AWS Session Token from session if available
      if (session) {
        const extendedSession = session as ExtendedSession;
        if (extendedSession.awsSessionToken) {
          // Check if AWS credentials are still valid
          const now = Date.now();
          const isExpired =
            extendedSession.awsExpiresAt && extendedSession.awsExpiresAt <= now;

          if (!isExpired) {
            headers["X-AWS-Session-Token"] = extendedSession.awsSessionToken;
            if (extendedSession.awsExpiresAt) {
              headers["X-AWS-Expires-At"] =
                extendedSession.awsExpiresAt.toString();
            }
            console.debug(
              "✅ Added AWS session token from session to API headers"
            );
          } else {
            console.warn(
              "⚠️ AWS session token in session has expired - server will refresh"
            );
            // Don't add expired tokens to headers, let the server handle refresh
            // The server-side session service will get fresh credentials using the ID token
          }
        } else {
          console.debug("⚠️ No AWS session token found in session");
        }
      }

      // Add user ID to headers if available (UUID from session.user.id)
      const extendedSession = session as ExtendedSession;
      if (extendedSession?.user?.id) {
        headers["X-User-ID"] = extendedSession.user.id;
        console.debug("Added X-User-ID header:", extendedSession.user.id);
      } else {
        console.warn("No user ID found in session for X-User-ID header");
      }

      // Debug logging for token availability
      console.debug("Auth headers prepared:", {
        hasSession: !!session,
        hasAccessToken: session
          ? !!(session as ExtendedSession).accessToken
          : false,
        hasIdToken: session
          ? !!(
              (session as ExtendedSession).idToken ||
              (typeof session === "object" &&
                session !== null &&
                "id_token" in session &&
                typeof (session as { id_token?: string }).id_token ===
                  "string" &&
                (session as { id_token: string }).id_token)
            )
          : false,
        hasEmail: !!userEmail,
        tokenTypes: {
          accessToken:
            session && (session as ExtendedSession).accessToken
              ? "present"
              : "missing",
          idToken:
            session &&
            ((session as ExtendedSession).idToken ||
              (typeof session === "object" &&
                session !== null &&
                "id_token" in session &&
                typeof (session as { id_token?: string }).id_token ===
                  "string" &&
                (session as { id_token: string }).id_token))
              ? "present"
              : "missing",
        },
      });

      return headers;
    } catch (error) {
      console.error("Failed to get auth headers:", error);

      // For requests that don't require authentication, still try to include saved email
      try {
        const savedEmail = await this.getSavedEmail();
        if (savedEmail) {
          return {
            "Content-Type": "application/json",
            "X-User-Email": savedEmail,
          };
        }
      } catch (savedEmailError) {
        console.debug("No saved email available:", savedEmailError);
      }

      throw new Error("Authentication required");
    }
  }

  /**
   * Make an authenticated API request
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      // Get authentication headers
      const authHeaders = await this.getAuthHeaders();

      // Merge headers
      const headers = {
        ...authHeaders,
        ...options.headers,
      };

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: T | undefined;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = (await response.text()) as T;
      }

      const result: ApiResponse<T> = {
        data,
        status: response.status,
        ok: response.ok,
        credentials: {} as CognitoCredentials,
        success: false,
      };

      if (!response.ok) {
        result.error =
          typeof data === "object" && data && "error" in data
            ? (data as { error?: string }).error
            : `Request failed with status ${response.status}`;
      }

      return result;
    } catch (error: unknown) {
      // Handle timeout and network errors
      const isError = error instanceof Error;
      const errorName = isError ? error.name : "Unknown";
      const errorMessage = isError ? error.message : "Unknown error occurred";

      if (errorName === "AbortError") {
        if (attempt < this.retries) {
          console.warn(
            `Request timeout, retrying... (${attempt}/${this.retries})`
          );
          return this.makeRequest(url, options, attempt + 1);
        }
        return {
          error: "Request timeout",
          status: 408,
          ok: false,
          credentials: {} as CognitoCredentials,
          success: false,
        };
      }

      if (
        errorMessage === "Authentication required" ||
        errorMessage === "No active session found"
      ) {
        return {
          error: errorMessage,
          status: 401,
          ok: false,
          credentials: {} as CognitoCredentials,
          success: false,
        };
      }

      // Retry on network errors
      if (
        attempt < this.retries &&
        (errorName === "TypeError" || errorName === "NetworkError")
      ) {
        console.warn(`Network error, retrying... (${attempt}/${this.retries})`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        return this.makeRequest(url, options, attempt + 1);
      }

      return {
        error: errorMessage || "Network error",
        status: 0,
        ok: false,
        credentials: {} as CognitoCredentials,
        success: false,
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(
    url: string,
    options: Omit<RequestInit, "method" | "body"> = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: "GET" });
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: unknown,
    options: Omit<RequestInit, "method" | "body"> = {}
  ): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.makeRequest<T>(url, { ...options, method: "POST", body });
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    data?: unknown,
    options: Omit<RequestInit, "method" | "body"> = {}
  ): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.makeRequest<T>(url, { ...options, method: "PUT", body });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    url: string,
    data?: unknown,
    options: Omit<RequestInit, "method" | "body"> = {}
  ): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.makeRequest<T>(url, { ...options, method: "DELETE", body });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: unknown,
    options: Omit<RequestInit, "method" | "body"> = {}
  ): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined;
    return this.makeRequest<T>(url, { ...options, method: "PATCH", body });
  }
}

// Create a default instance
export const apiClient = new ApiClient();

// Convenience functions for common API calls
export const api = {
  get: <T>(url: string, options?: Omit<RequestInit, "method" | "body">) =>
    apiClient.get<T>(url, options),

  post: <T>(
    url: string,
    data?: unknown,
    options?: Omit<RequestInit, "method" | "body">
  ) => apiClient.post<T>(url, data, options),

  put: <T>(
    url: string,
    data?: unknown,
    options?: Omit<RequestInit, "method" | "body">
  ) => apiClient.put<T>(url, data, options),

  delete: <T>(
    url: string,
    data?: unknown,
    options?: Omit<RequestInit, "method" | "body">
  ) => apiClient.delete<T>(url, data, options),

  patch: <T>(
    url: string,
    data?: unknown,
    options?: Omit<RequestInit, "method" | "body">
  ) => apiClient.patch<T>(url, data, options),
};
