/**
 * Package Page Router Component
 * Loads components from package registries based on hash routing
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { PackagePageRouterProps } from "../types/package";

// Dynamic package registry loader
async function loadPackageRegistry(packageName: string) {
  try {
    // Only load from known packages to avoid webpack bundling issues
    let appModule;
    switch (packageName) {
      case "core":
        appModule = await import("../app");
        break;
      case "mi":
        // Runtime import to avoid circular dependency during build
        try {
          appModule = await import("@captify/mi/app");
        } catch (error) {
          console.warn("MI package not available:", error);
          return null;
        }
        break;
      default:
        return null;
    }

    // Get the component and page registries from the app module
    const { pages, components } = appModule;

    if (pages || components) {
      // Return a function that provides the component for specific routes
      return async (routeName: string) => {
        // Try pages first, then components
        const pageLoader = pages?.[routeName as keyof typeof pages] as any;
        if (pageLoader) {
          const loadedModule = await pageLoader();
          return loadedModule.default || loadedModule;
        }

        const componentLoader = components?.[
          routeName as keyof typeof components
        ] as any;
        if (componentLoader) {
          const loadedModule = await componentLoader();
          return loadedModule.default || loadedModule;
        }

        return null;
      };
    } else {
      return null;
    }
  } catch (error) {
    // Failed to load package registry for ${packageName}:`, error);
    return null;
  }
}

export function PackagePageRouter({
  currentHash: propCurrentHash,
  packageSlug,
  packageName,
}: PackagePageRouterProps = {}) {
  const [internalHash, setInternalHash] = useState<string>("home");
  const [PageComponent, setPageComponent] =
    useState<React.ComponentType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Use prop currentHash if provided, otherwise use internal state
  const currentHash = propCurrentHash || internalHash;
  // Listen for hash changes (only if not using prop)
  useEffect(() => {
    if (propCurrentHash) {
      // Skip internal hash listening if prop is provided
      return;
    }

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the #
      const newPage = hash || "home"; // Default to 'home' if no hash

      setInternalHash((prevHash) => {
        if (newPage !== prevHash) {
          return newPage;
        } else {
          return prevHash;
        }
      });
    };

    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);

    // Also listen for popstate in case of programmatic navigation
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [internalHash, propCurrentHash]);

  // Load page component when hash or package changes
  useEffect(() => {
    if (!packageSlug) {
      return;
    }

    const loadPage = async () => {
      setIsLoading(true);
      setLoadError(null);
      setPageComponent(null);

      try {
        // Load the package registry
        const loadComponent = await loadPackageRegistry(packageSlug);

        if (!loadComponent) {
          throw new Error(`Package ${packageSlug} registry not found`);
        }

        // Get the page component from the registry
        const component = await loadComponent(currentHash);

        if (component) {
          setPageComponent(() => component);
        } else {
          setLoadError(
            `Page "${currentHash}" not found in package "${packageName}"`
          );
          setPageComponent(null);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setLoadError(`Failed to load page "${currentHash}": ${errorMessage}`);
        setPageComponent(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [currentHash, packageSlug]);

  if (!packageSlug) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading package configuration...
          </p>
        </div>
      </div>
    );
  }

  // Debug panel removed - navigation working properly

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Loading Page</h3>
            <p className="text-muted-foreground">
              Loading {currentHash} from {packageSlug}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If we have a page component, render it
  if (PageComponent) {
    return (
      <div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          }
        >
          <PageComponent />
        </Suspense>
      </div>
    );
  }

  // Show error state
  return (
    <div>
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-2xl">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The page "{currentHash}" could not be found in package "
              {packageSlug}".
            </p>
          </div>

          {loadError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{loadError}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <p className="font-medium mb-2">Expected structure:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>
                @captify/{packageSlug} should export app.loadComponent function
              </li>
              <li>
                app.loadComponent("{currentHash}") should return a React
                component
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <button
              onClick={() => (window.location.hash = "home")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
