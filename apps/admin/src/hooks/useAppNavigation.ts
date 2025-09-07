/**
 * App Navigation Hook
 * Optimizes navigation between apps and packages with proper state management
 */
"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "../types";

export function useAppNavigation() {
  const router = useRouter();
  const [currentApp, setCurrentAppState] = useState<App | undefined>(undefined);

  const setCurrentApp = useCallback((app: App) => {
    setCurrentAppState(app);
  }, []);

  const getCurrentAppConfig = useCallback(() => {
    return currentApp;
  }, [currentApp]);

  /**
   * Navigate to a specific app
   * Sets the current app and navigates to the app route
   */
  const navigateToApp = useCallback(
    (app: App) => {
      // Set current app
      setCurrentApp(app);

      // Navigate to the app's route
      const appRoute = `/${app.slug}`;
      router.push(appRoute);
    },
    [setCurrentApp, router]
  );

  /**
   * Navigate within the current app to a specific page
   * Maintains app context while changing the hash route
   */
  const navigateToPage = useCallback((pageRoute: string) => {
    window.location.hash = pageRoute;
  }, []);

  /**
   * Check if we're currently in a specific app
   */
  const isCurrentApp = useCallback(
    (appSlug: string) => {
      return currentApp?.slug === appSlug;
    },
    [currentApp]
  );

  return {
    navigateToApp,
    navigateToPage,
    currentApp,
    isCurrentApp,
  };
}
