/**
 * Client-side Captify API
 * Provides a simple interface for interacting with Captify resources
 * Automatically handles authentication and app context
 */

"use client";

import type {
  CaptifyRequest,
  CaptifyResponse,
  CaptifyClientOptions,
} from "./types";

// Re-export types for easier importing
export type {
  CaptifyRequest,
  CaptifyResponse,
  CaptifyClientOptions,
} from "./types";

export class CaptifyClient {
  private appId?: string;
  private baseUrl: string;
  private session?: any;

  constructor(options: CaptifyClientOptions = {}) {
    this.appId = options.appId;
    this.baseUrl = options.baseUrl || "/api/captify";
    this.session = options.session;
  }

  /**
   * GET operation - retrieve data
   */
  async get<T = any>(request: CaptifyRequest): Promise<CaptifyResponse<T>> {
    return this.makeRequest("GET", request);
  }

  /**
   * POST operation - create new data
   */
  async post<T = any>(request: CaptifyRequest): Promise<CaptifyResponse<T>> {
    return this.makeRequest("POST", request);
  }

  /**
   * PUT operation - update/replace data
   */
  async put<T = any>(request: CaptifyRequest): Promise<CaptifyResponse<T>> {
    return this.makeRequest("PUT", request);
  }

  /**
   * DELETE operation - remove data
   */
  async delete<T = any>(request: CaptifyRequest): Promise<CaptifyResponse<T>> {
    return this.makeRequest("DELETE", request);
  }

  /**
   * Internal method to make HTTP requests
   */
  private async makeRequest<T = any>(
    method: string,
    request: CaptifyRequest
  ): Promise<CaptifyResponse<T>> {
    try {
      // Get authentication headers
      const headers = await this.getAuthHeaders();

      // Determine the resource type and build the request
      const apiRequest = this.buildApiRequest(method, request);

      const response = await fetch(this.baseUrl, {
        method: "POST", // Always POST to the unified API endpoint
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(apiRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: Request failed`,
        };
      }

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: `Request failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Get authentication headers from NextAuth session
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    // Use provided session or fallback to useSession hook (only in React context)
    const sessionData = this.session;

    if (sessionData?.user) {
      // Set the required headers based on session data
      if (sessionData.user.id) {
        headers["X-User-Id"] = sessionData.user.id;
      }
      if (sessionData.user.email) {
        headers["X-User-Email"] = sessionData.user.email;
      }
      if ((sessionData as any)?.idToken) {
        headers["X-Access-Token"] = (sessionData as any).idToken;
      }
      if ((sessionData as any)?.awsSessionToken) {
        headers["X-Access-Id"] = (sessionData as any).awsSessionToken;
      }
    }

    // If appId is provided, include it
    if (this.appId) {
      headers["X-App-Id"] = this.appId;
    }

    return headers;
  }

  /**
   * Build the API request based on the resource type
   */
  private buildApiRequest(method: string, request: CaptifyRequest) {
    if (request.table) {
      // DynamoDB operations - use new unified API format
      let operation: string;
      let data: any = { ...request.params };

      switch (method) {
        case "GET":
          operation = request.key ? "get" : "scan";
          if (request.key) {
            data.key = request.key;
          }
          break;
        case "POST":
          operation = "put";
          data.item = request.item;
          break;
        case "PUT":
          operation = request.key ? "update" : "put";
          if (request.key) {
            data.key = request.key;
            data.item = request.item;
          } else {
            data.item = request.item;
          }
          break;
        case "DELETE":
          operation = "delete";
          data.key = request.key;
          break;
        default:
          throw new Error(`Unsupported HTTP method for DynamoDB: ${method}`);
      }

      return {
        service: "dynamodb",
        operation,
        tableName: request.table,
        data,
      };
    } else if (request.bucket) {
      // S3 operations
      return {
        service: "s3",
        operation: request.operation || method.toLowerCase(),
        data: { bucket: request.bucket, ...request.params },
      };
    } else if (request.function) {
      // Lambda operations
      return {
        service: "lambda",
        operation: request.operation || method.toLowerCase(),
        data: { function: request.function, ...request.params },
      };
    } else if (request.resource) {
      // Generic resource operations (legacy)
      return {
        resource: request.resource,
        operation: request.operation || method.toLowerCase(),
        data: { ...(request.params || {}), ...(request.data || {}) },
      };
    } else {
      throw new Error("No valid resource specified in request");
    }
  }
}

// Export singleton for non-React usage
export const captify = new CaptifyClient();
