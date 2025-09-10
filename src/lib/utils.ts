import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Session } from "next-auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID(): string {
  return crypto.randomUUID();
}


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
}

class ApiClient {
  private identityPoolId?: string;
  private appSlug?: string;

  setAppIdentityPool(identityPoolId: string, appSlug: string) {
    this.identityPoolId = identityPoolId;
    this.appSlug = appSlug;
  }

  async run<T = any>(request: ApiRequest): Promise<CaptifyResponse<T>> {
    try {
      // Use app from request, default to "core" if not specified
      const app = request.app || "core";
      const url = `/api/captify`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app": app,
        },
        body: JSON.stringify(request),
      });

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

