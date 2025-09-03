/**
 * React hooks for Captify API operations
 */
"use client";

import { useState, useCallback } from "react";
import { apiClient, type CaptifyResponse } from "../lib";

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
    client: typeof apiClient,
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
        const response = await apiCall(apiClient, ...args);

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
    client.run({
      service: "dynamo",
      operation: "getItem",
      app: "core",
      table: tableName,
      data: { Key: key },
    })
  );
}

/**
 * Hook for DynamoDB put operations
 */
export function usePutItem<T = any>(tableName: string) {
  return useApi<T>((client, item: Record<string, any>) =>
    client.run({
      service: "dynamo",
      operation: "put",
      app: "core",
      table: tableName,
      data: { Item: item },
    })
  );
}

/**
 * Hook for DynamoDB update operations
 */
export function useUpdateItem<T = any>(tableName: string) {
  return useApi<T>(
    (
      client,
      key: Record<string, any>,
      updateExpression: string,
      expressionAttributeValues?: Record<string, any>,
      expressionAttributeNames?: Record<string, any>
    ) =>
      client.run({
        service: "dynamo",
        operation: "update",
        app: "core",
        table: tableName,
        data: {
          Key: key,
          UpdateExpression: updateExpression,
          ExpressionAttributeValues: expressionAttributeValues,
          ExpressionAttributeNames: expressionAttributeNames,
          ReturnValues: "ALL_NEW",
        },
      })
  );
}

/**
 * Hook for DynamoDB delete operations
 */
export function useDeleteItem(tableName: string) {
  return useApi<{ success: boolean }>((client, key: Record<string, any>) =>
    client.run({
      service: "dynamo",
      operation: "delete",
      app: "core",
      table: tableName,
      data: { Key: key },
    })
  );
}

/**
 * Hook for DynamoDB scan operations
 */
export function useScanTable<T = any>(tableName: string) {
  return useApi<{ items: T[] }>((client, params: Record<string, any> = {}) =>
    client.run({
      service: "dynamo",
      operation: "scan",
      app: "core",
      table: tableName,
      data: params,
    })
  );
}

/**
 * Hook for auth operations
 * TODO: These hooks need to be implemented with proper auth endpoints
 */
export function useAuth() {
  // const validateSession = useApi<{ valid: boolean }>(
  //   (client, idToken: string) =>
  //     client.post({
  //       resource: "auth",
  //       operation: "validate",
  //       data: { idToken },
  //     })
  // );

  // const refreshSession = useApi<any>((client, idToken: string) =>
  //   client.post({ resource: "auth", operation: "refresh", data: { idToken } })
  // );

  // const getAwsCredentials = useApi<{ credentials: any }>(
  //   (client, idToken: string, identityPoolId: string) =>
  //     client.post({
  //       resource: "auth",
  //       operation: "getAwsCredentials",
  //       data: { idToken, identityPoolId },
  //     })
  // );

  return {
    // validateSession: validateSession.execute,
    // refreshSession: refreshSession.execute,
    // getAwsCredentials: getAwsCredentials.execute,
    loading: false,
    error: null,
  };
}
