"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { App } from "../types";
import { apiClient } from "@captify/core/lib";

/**
 * Hook to access current app context and configuration
 * Fetches data directly from DynamoDB when needed
 */
export function useAppContext() {
  const { data: session } = useSession();
  const [availableApps, setAvailableApps] = useState<App[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [currentApp, setCurrentAppState] = useState<App | undefined>(undefined);

  // Fetch available apps from DynamoDB
  const fetchAvailableApps = useCallback(async () => {
    if (!session?.user) return;

    setAppsLoading(true);
    try {
      const response = await apiClient.run({
        service: "dynamo",
        operation: "scan",
        app: "core",
        table: "App",
        data: {
          FilterExpression: "#status = :status",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "active",
          },
        },
      });

      if (response.success && response.data?.Items) {
        setAvailableApps(response.data.Items as App[]);
      }
    } catch (error) {
      console.error("Error fetching available apps:", error);
    } finally {
      setAppsLoading(false);
    }
  }, [session?.user]);

  // Load apps when session is available
  useEffect(() => {
    if (session?.user) {
      fetchAvailableApps();
    }
  }, [session?.user, fetchAvailableApps]);

  const setCurrentApp = useCallback((app: App) => {
    setCurrentAppState(app);
  }, []);

  const getCurrentAppConfig = useCallback(() => {
    return currentApp;
  }, [currentApp]);

  /**
   * Get the identity pool ID for the current app
   * Falls back to core app's identity pool if no current app or identityPoolId
   */
  const getCurrentIdentityPoolId = useCallback((): string | undefined => {
    if (currentApp?.identityPoolId) {
      return currentApp.identityPoolId;
    }

    // Fallback to core app
    const coreApp = availableApps.find((app: App) => app.slug === "core");
    return coreApp?.identityPoolId;
  }, [currentApp, availableApps]);

  /**
   * Get app configuration by slug
   */
  const getAppBySlug = useCallback(
    (slug: string) => {
      return availableApps.find((app: App) => app.slug === slug);
    },
    [availableApps]
  );

  /**
   * Check if a specific app is available
   */
  const isAppAvailable = useCallback(
    (slug: string): boolean => {
      return availableApps.some(
        (app: App) => app.slug === slug && app.status === "active"
      );
    },
    [availableApps]
  );

  /**
   * Get AWS configuration for a specific app
   */
  const getAppAwsConfig = useCallback(
    (slug: string) => {
      const app = getAppBySlug(slug);
      return {
        identityPoolId: app?.identityPoolId,
        agentId: app?.agentId,
        agentAliasId: app?.agentAliasId,
      };
    },
    [getAppBySlug]
  );

  return {
    // App context data
    currentApp,
    availableApps,
    appsLoading,

    // App management functions
    setCurrentApp,
    getCurrentAppConfig,
    getAppBySlug,
    isAppAvailable,

    // AWS configuration helpers
    getCurrentIdentityPoolId,
    getAppAwsConfig,
  };
}
