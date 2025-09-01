import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Session } from "next-auth";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createApiClient(): CaptifyClient {
  return new CaptifyClient({
    appId: "core",
    session: null, // Session will be handled by the client internally
  });
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

// CaptifyClient with convenience methods
export class CaptifyClient extends ApiClient {
  private appId: string;
  private session: Session | null;

  constructor(config?: { appId?: string; session?: Session | null }) {
    super();
    this.appId = config?.appId || "core";
    this.session = config?.session || null;
  }

  async query(params: { table: string; [key: string]: any }) {
    return this.run({
      service: "dynamo",
      operation: "query",
      app: this.appId,
      table: params.table,
      data: params,
    });
  }

  async get(params: { table: string; [key: string]: any }) {
    return this.run({
      service: "dynamo",
      operation: "scan",
      app: this.appId,
      table: params.table,
      data: params,
    });
  }

  async getItem(params: { table: string; key: any }) {
    return this.run({
      service: "dynamo",
      operation: "get",
      app: this.appId,
      table: params.table,
      data: { key: params.key },
    });
  }

  async put(params: { table: string; data: any }) {
    return this.run({
      service: "dynamo",
      operation: "put",
      app: this.appId,
      table: params.table,
      data: params.data,
    });
  }

  async update(params: { table: string; [key: string]: any }) {
    return this.run({
      service: "dynamo",
      operation: "update",
      app: this.appId,
      table: params.table,
      data: params,
    });
  }

  async delete(params: { table: string; key: any }) {
    return this.run({
      service: "dynamo",
      operation: "delete",
      app: this.appId,
      table: params.table,
      data: { key: params.key },
    });
  }
}

// Export logout utilities
export { handleCognitoLogout, handleSilentLogout } from "./logout";
