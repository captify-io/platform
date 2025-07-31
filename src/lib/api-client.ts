import { getSession } from "next-auth/react";

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = any> {
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
   * Get authentication headers for API requests
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const session = await getSession();

      if (!session) {
        throw new Error("No active session found");
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add session data to headers for server-side API routes
      if (session.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }

      // CRITICAL: Add ID token for Cognito Identity Pool authentication
      // Neptune/AWS services require ID tokens, not access tokens for Identity Pool
      if (session.idToken) {
        headers["X-ID-Token"] = session.idToken;
      } else if ((session as any).id_token) {
        // Fallback for different session structures
        headers["X-ID-Token"] = (session as any).id_token;
      } else {
        console.warn(
          "No ID token found in session - Neptune authentication may fail"
        );
      }

      if (session.user?.email) {
        headers["X-User-Email"] = session.user.email;
      }

      // Use sub from JWT token if available
      if ((session as any).user?.id) {
        headers["X-User-ID"] = (session as any).user.id;
      }

      // Debug logging for token availability
      console.debug("Auth headers prepared:", {
        hasAccessToken: !!session.accessToken,
        hasIdToken: !!(session.idToken || (session as any).id_token),
        hasEmail: !!session.user?.email,
        tokenTypes: {
          accessToken: session.accessToken ? "present" : "missing",
          idToken:
            session.idToken || (session as any).id_token
              ? "present"
              : "missing",
        },
      });

      return headers;
    } catch (error) {
      console.error("Failed to get auth headers:", error);
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
        data = (await response.text()) as any;
      }

      const result: ApiResponse<T> = {
        data,
        status: response.status,
        ok: response.ok,
      };

      if (!response.ok) {
        result.error =
          typeof data === "object" && data && "error" in data
            ? (data as any).error
            : `Request failed with status ${response.status}`;
      }

      return result;
    } catch (error: any) {
      // Handle timeout and network errors
      if (error.name === "AbortError") {
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
        };
      }

      if (
        error.message === "Authentication required" ||
        error.message === "No active session found"
      ) {
        return {
          error: error.message,
          status: 401,
          ok: false,
        };
      }

      // Retry on network errors
      if (
        attempt < this.retries &&
        (error.name === "TypeError" || error.name === "NetworkError")
      ) {
        console.warn(`Network error, retrying... (${attempt}/${this.retries})`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        return this.makeRequest(url, options, attempt + 1);
      }

      return {
        error: error.message || "Network error",
        status: 0,
        ok: false,
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
    data?: any,
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
    data?: any,
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
    options: Omit<RequestInit, "method" | "body"> = {}
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: "DELETE" });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: any,
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
    data?: any,
    options?: Omit<RequestInit, "method" | "body">
  ) => apiClient.post<T>(url, data, options),

  put: <T>(
    url: string,
    data?: any,
    options?: Omit<RequestInit, "method" | "body">
  ) => apiClient.put<T>(url, data, options),

  delete: <T>(url: string, options?: Omit<RequestInit, "method" | "body">) =>
    apiClient.delete<T>(url, options),

  patch: <T>(
    url: string,
    data?: any,
    options?: Omit<RequestInit, "method" | "body">
  ) => apiClient.patch<T>(url, data, options),
};
