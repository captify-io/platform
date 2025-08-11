/**
 * Base API Handler
 *
 * Wraps requireUserSession with app config loading and provides a consistent
 * foundation for all API routes. Maintains existing security patterns while
 * adding configuration and shared service access.
 */

import { requireUserSession } from "@/lib/services/session";
import { loadAppConfig } from "@/lib/services/config";
import { SHARED_TABLES } from "@/lib/config/database";
import {
  createApiResponse,
  createApiError,
  HTTP_STATUS,
} from "@/lib/types/api";
import type { AppConfig } from "@/lib/types/config";
import type { SessionInfo } from "@/lib/types/api";

/**
 * API Handler Context - everything an API route needs
 */
export interface ApiHandlerContext {
  session: SessionInfo;
  appConfig?: AppConfig;
  sharedTables: typeof SHARED_TABLES;
  helpers: {
    createResponse: typeof createApiResponse;
    createError: typeof createApiError;
    httpStatus: typeof HTTP_STATUS;
  };
}

/**
 * Create API handler context with session validation and app config loading
 *
 * @param appId - Optional app ID to load configuration for
 * @returns Validated session and loaded app config
 */
export async function createApiHandler(
  appId?: string
): Promise<ApiHandlerContext> {
  // Step 1: Always validate session first (existing pattern)
  const session = await requireUserSession();

  // Step 2: Load app config if appId provided
  let appConfig: AppConfig | undefined;
  if (appId) {
    try {
      appConfig = await loadAppConfig(appId);
    } catch (error) {
      console.error(`Failed to load app config for ${appId}:`, error);
      // Don't throw here - let the API decide how to handle missing config
    }
  }

  // Step 3: Return handler context
  return {
    session,
    appConfig,
    sharedTables: SHARED_TABLES,
    helpers: {
      createResponse: createApiResponse,
      createError: createApiError,
      httpStatus: HTTP_STATUS,
    },
  };
}

/**
 * Create API handler for app-specific endpoints
 *
 * @param appId - Required app ID
 * @returns Handler context with guaranteed app config
 */
export async function createAppApiHandler(
  appId: string
): Promise<ApiHandlerContext & { appConfig: AppConfig }> {
  const context = await createApiHandler(appId);

  if (!context.appConfig) {
    throw new Error(`Failed to load configuration for app: ${appId}`);
  }

  return {
    ...context,
    appConfig: context.appConfig,
  };
}

/**
 * Wrapper for API routes that automatically handles session validation
 * and provides consistent error responses
 */
export function withApiHandler<T>(
  handler: (context: ApiHandlerContext) => Promise<T>,
  appId?: string
) {
  return async (): Promise<T> => {
    try {
      const context = await createApiHandler(appId);
      return await handler(context);
    } catch (error) {
      console.error("API handler error:", error);
      throw error;
    }
  };
}

/**
 * Get app table name with error handling
 */
export function getAppTable(
  context: ApiHandlerContext,
  tableName: string
): string {
  if (!context.appConfig) {
    throw new Error("No app configuration available");
  }

  if (!context.appConfig.database?.tables) {
    throw new Error(
      `App ${context.appConfig.id} has no database configuration`
    );
  }

  const table = context.appConfig.database.tables[tableName];
  if (!table) {
    throw new Error(
      `Table ${tableName} not found in app ${context.appConfig.id} config`
    );
  }

  return table;
}

/**
 * Get shared table name
 */
export function getSharedTable(
  context: ApiHandlerContext,
  tableName: keyof typeof SHARED_TABLES
): string {
  return context.sharedTables[tableName];
}
