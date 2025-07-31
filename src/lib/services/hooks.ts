/**
 * Service-specific hooks for external service integrations
 * Provides type-safe access to configured services
 */

import { useEffect, useState } from "react";
import { serviceManager, ServiceConnection } from "./external-services";

export interface UseServiceResult {
  connection: ServiceConnection | undefined;
  isConnected: boolean;
  isHealthy: "healthy" | "unhealthy" | "unknown";
  isLoading: boolean;
  error: string | null;
  testConnection: () => Promise<boolean>;
}

export function useService(serviceId: string): UseServiceResult {
  const [connection, setConnection] = useState<ServiceConnection | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [isHealthy, setIsHealthy] = useState<
    "healthy" | "unhealthy" | "unknown"
  >("unknown");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConnection = async () => {
      try {
        const conn = serviceManager.getConnection(serviceId);
        setConnection(conn);

        if (conn) {
          const connected = await serviceManager.testConnection(serviceId);
          setIsConnected(connected);

          const health = await serviceManager.getHealthStatus(serviceId);
          setIsHealthy(health);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    loadConnection();
  }, [serviceId]);

  const testConnection = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceManager.testConnection(serviceId);
      setIsConnected(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection test failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    connection,
    isConnected,
    isHealthy,
    isLoading,
    error,
    testConnection,
  };
}

// Specific hooks for AWS services
export const useNeptune = () => useService("neptune");
export const useBedrock = () => useService("bedrock");
export const useLambda = () => useService("lambda");
