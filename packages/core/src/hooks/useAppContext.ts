"use client";
import { useCaptify } from "../context/CaptifyContext";
import { App } from "../types";

/**
 * Hook to access current app context and configuration
 * Provides easy access to current app's AWS configuration
 */
export function useAppContext() {
  const { appContext, getCurrentAppConfig, setCurrentApp } = useCaptify();

  /**
   * Get the identity pool ID for the current app
   * Falls back to core app's identity pool if no current app or identityPoolId
   */
  const getCurrentIdentityPoolId = (): string | undefined => {
    const currentApp = getCurrentAppConfig();

    if (currentApp?.identityPoolId) {
      return currentApp.identityPoolId;
    }

    // Fallback to core app
    const coreApp = appContext.availableApps.find(
      (app: App) => app.slug === "core"
    );
    return coreApp?.identityPoolId;
  };

  /**
   * Get app configuration by slug
   */
  const getAppBySlug = (slug: string) => {
    return appContext.availableApps.find((app: App) => app.slug === slug);
  };

  /**
   * Check if a specific app is available
   */
  const isAppAvailable = (slug: string): boolean => {
    return appContext.availableApps.some(
      (app: App) => app.slug === slug && app.status === "active"
    );
  };

  /**
   * Get AWS configuration for a specific app
   */
  const getAppAwsConfig = (slug: string) => {
    const app = getAppBySlug(slug);
    return {
      identityPoolId: app?.identityPoolId,
      agentId: app?.agentId,
      agentAliasId: app?.agentAliasId,
    };
  };

  return {
    // App context data
    ...appContext,

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
