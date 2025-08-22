/**
 * React hooks for Captify API operations
 */

import { useState, useCallback } from "react";
import { CaptifyClient, type CaptifyResponse } from "../api/client";
import { createApiClient } from "../api/utils";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Generic hook for API operations
 */
export function useApi<T = any>(
  apiCall: (
    client: CaptifyClient,
    ...args: any[]
  ) => Promise<CaptifyResponse<T>>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const client = createApiClient();
        const response = await apiCall(client, ...args);

        if (response.success) {
          setState({
            data: response.data || null,
            loading: false,
            error: null,
          });
          return response.data || null;
        } else {
          setState({
            data: null,
            loading: false,
            error: response.error || "API call failed",
          });
          return null;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        return null;
      }
    },
    [apiCall]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for DynamoDB get operations
 */
export function useGetItem<T = any>(tableName: string) {
  return useApi<T>((client, key: Record<string, any>) =>
    client.get({ table: tableName, key })
  );
}

/**
 * Hook for DynamoDB put operations
 */
export function usePutItem<T = any>(tableName: string) {
  return useApi<T>((client, item: Record<string, any>) =>
    client.post({ table: tableName, item })
  );
}

/**
 * Hook for DynamoDB update operations
 */
export function useUpdateItem<T = any>(tableName: string) {
  return useApi<T>(
    (client, key: Record<string, any>, item: Record<string, any>) =>
      client.put({ table: tableName, key, item })
  );
}

/**
 * Hook for DynamoDB delete operations
 */
export function useDeleteItem(tableName: string) {
  return useApi<{ success: boolean }>((client, key: Record<string, any>) =>
    client.delete({ table: tableName, key })
  );
}

/**
 * Hook for DynamoDB scan operations
 */
export function useScanTable<T = any>(tableName: string) {
  return useApi<{ items: T[] }>((client, params: Record<string, any> = {}) =>
    client.get({ table: tableName, params })
  );
}

/**
 * Hook for auth operations
 */
export function useAuth() {
  const validateSession = useApi<{ valid: boolean }>(
    (client, idToken: string) =>
      client.post({
        resource: "auth",
        operation: "validate",
        data: { idToken },
      })
  );

  const refreshSession = useApi<any>((client, idToken: string) =>
    client.post({ resource: "auth", operation: "refresh", data: { idToken } })
  );

  const getAwsCredentials = useApi<{ credentials: any }>(
    (client, idToken: string, identityPoolId: string) =>
      client.post({
        resource: "auth",
        operation: "getAwsCredentials",
        data: { idToken, identityPoolId },
      })
  );

  return {
    validateSession: validateSession.execute,
    refreshSession: refreshSession.execute,
    getAwsCredentials: getAwsCredentials.execute,
    loading:
      validateSession.loading ||
      refreshSession.loading ||
      getAwsCredentials.loading,
    error:
      validateSession.error || refreshSession.error || getAwsCredentials.error,
  };
}
