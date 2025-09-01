/**
 * App Navigation Hook
 * Optimizes navigation between apps and packages with proper state management
 */

import { useCallback } from "react";
import { useCaptify } from "../context/CaptifyContext";
import { useRouter } from "next/navigation";
import { App } from "@captify/core";

export function useAppNavigation() {
  const { setCurrentApp, getCurrentAppConfig } = useCaptify();
  const router = useRouter();

  /**
   * Navigate to a specific app
   * Sets the current app in CaptifyContext and navigates to the app route
   */
  const navigateToApp = useCallback(
    (app: App) => {
      // Set current app in global context
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
   * Get the current app configuration
   */
  const currentApp = getCurrentAppConfig();

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
