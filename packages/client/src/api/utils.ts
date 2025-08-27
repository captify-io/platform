/**
 * API utility functions for easier integration
 */

import { CaptifyClient, type CaptifyClientOptions } from "./client";
import { getCaptifyConfig, isCaptifyInitialized } from "./config";

/**
 * Create a configured API client instance
 * This function provides a convenient way to get a properly configured client
 */
export function createApiClient(
  options: CaptifyClientOptions = {}
): CaptifyClient {
  // Get base URL from config if available and not provided
  if (!options.baseUrl && isCaptifyInitialized()) {
    try {
      const config = getCaptifyConfig();
      options.baseUrl = config.api?.gatewayUrl || "/api/captify";
    } catch {
      // Fall back to default if config is not available
      options.baseUrl = "/api/captify";
    }
  }

  return new CaptifyClient(options);
}

/**
 * Helper function to handle API responses with proper error handling
 */
export async function handleApiResponse<T>(
  apiCall: () => Promise<import("./types.js").CaptifyResponse<T>>
): Promise<T> {
  try {
    const response = await apiCall();

    if (response.success && response.data !== undefined) {
      return response.data;
    }

    throw new Error(response.error || "API call failed");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown API error occurred");
  }
}

/**
 * Helper function for common DynamoDB operations
 */
export class ApiHelpers {
  private client: CaptifyClient;

  constructor(client?: CaptifyClient) {
    this.client = client || createApiClient();
  }

  /**
   * Get a single item from DynamoDB
   */
  async getItem<T>(
    tableName: string,
    key: Record<string, any>
  ): Promise<T | null> {
    const response = await this.client.get({
      table: tableName,
      key,
    });

    return response.success ? (response.data as T) : null;
  }

  /**
   * Put an item into DynamoDB
   */
  async putItem<T>(
    tableName: string,
    item: Record<string, any>
  ): Promise<T | null> {
    const response = await this.client.post({
      table: tableName,
      item,
    });

    return response.success ? (response.data as T) : null;
  }

  /**
   * Update an item in DynamoDB
   */
  async updateItem<T>(
    tableName: string,
    key: Record<string, any>,
    updates: Record<string, any>
  ): Promise<T | null> {
    const response = await this.client.put({
      table: tableName,
      key,
      item: updates,
    });

    return response.success ? (response.data as T) : null;
  }

  /**
   * Delete an item from DynamoDB
   */
  async deleteItem(
    tableName: string,
    key: Record<string, any>
  ): Promise<boolean> {
    const response = await this.client.delete({
      table: tableName,
      key,
    });

    return response.success;
  }

  /**
   * Scan a DynamoDB table with optional filters
   */
  async scanTable<T>(
    tableName: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    const response = await this.client.get({
      table: tableName,
      params,
    });

    return response.success ? response.data?.items || [] : [];
  }
}
