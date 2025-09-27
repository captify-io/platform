import type { Session } from "next-auth";

export interface CaptifyResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiRequest {
  service: string;
  operation: string;
  app?: string;
  table?: string;
  identityPoolId?: string; // Optional Identity Pool ID to use for AWS credentials
  forceRefresh?: boolean; // Force refresh of AWS credentials
  data?: {
    values?: Array<{ [field: string]: any }>;
    fields?: string[];
    index?: string;
    limit?: number;
    start?: any;
    [key: string]: any; // Allow any additional data
  };
  useCache?: boolean; // Use native fetch caching
}

class ApiClient {
  private currentAppIdentityPoolId: string | undefined = undefined;
  private currentAppSlug: string | undefined = undefined;

  // Environment-aware base URL detection
  private getBaseUrl(): string {
    // Development: use explicit platform URL if set
    // Production: use relative URLs (same origin)
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_CAPTIFY_API_URL || '';
    }
    // Server-side: always use relative URLs
    return '';
  }

  // Set the current app's identity pool ID (called when app context changes)
  setAppIdentityPool(poolId: string | undefined, appSlug?: string) {
    // Only update if it's actually changing to prevent unnecessary logs
    if (
      this.currentAppIdentityPoolId !== poolId ||
      this.currentAppSlug !== appSlug
    ) {
      this.currentAppIdentityPoolId = poolId;
      this.currentAppSlug = appSlug;
      console.log(
        `[ApiClient] Identity pool set for app '${appSlug || "unknown"}':`,
        poolId || "none"
      );
    }
  }

  // Get the current identity pool (for debugging)
  getCurrentIdentityPool(): string | undefined {
    return this.currentAppIdentityPoolId;
  }

  async run<T = any>(request: ApiRequest): Promise<CaptifyResponse<T>> {
    try {
      // Use app from request, default to "core" if not specified
      const app = request.app || "core";
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/captify`;

      // If no identity pool is explicitly provided, use the current app's pool
      const finalRequest = {
        ...request,
        identityPoolId: request.identityPoolId || this.currentAppIdentityPoolId,
      };

      // Debug logging
      console.log("[ApiClient] Request details:", {
        service: request.service,
        operation: request.operation,
        providedPoolId: request.identityPoolId,
        currentAppPoolId: this.currentAppIdentityPoolId,
        finalPoolId: finalRequest.identityPoolId,
      });

      // Log when using app's identity pool
      if (!request.identityPoolId && this.currentAppIdentityPoolId) {
        console.log(
          "[ApiClient] Using app identity pool for request:",
          this.currentAppIdentityPoolId
        );
      }

      const fetchOptions: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app": app,
        },
        body: JSON.stringify(finalRequest), // Use finalRequest which includes identityPoolId
      };

      // Add native fetch caching if requested
      if (request.useCache) {
        fetchOptions.cache = "force-cache";
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Helper function for Cognito admin operations
export async function runCognitoAdminOperation<T = any>(
  operation: string,
  params?: any
): Promise<CaptifyResponse<T>> {
  // Get admin Identity Pool ID from environment or use hardcoded value
  const adminPoolId =
    process.env.NEXT_PUBLIC_COGNITO_ADMIN_IDENTITY_POOL_ID ||
    "us-east-1:52e865f2-4871-4a74-8976-edc945af0c0f";

  return apiClient.run<T>({
    service: "cognito",
    operation,
    app: "core",
    identityPoolId: adminPoolId,
    forceRefresh: true, // Always refresh for admin operations
    data: params,
  });
}
