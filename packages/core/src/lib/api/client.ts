"use client";
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
  async run<T = any>(request: ApiRequest): Promise<CaptifyResponse<T>> {
    try {
      // Use app from request, default to "core" if not specified
      const app = request.app || "core";
      const url = `/api/captify`;

      const fetchOptions: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app": app,
        },
        body: JSON.stringify(request),
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
