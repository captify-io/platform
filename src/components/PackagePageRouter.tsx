/**
 * Package Page Router Component
 * Loads components from package registries based on hash routing
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { usePackageContext } from "../context/PackageContext";

// Dynamic package registry loader
async function loadPackageRegistry(packageName: string) {
  try {
    console.log(`Loading package registry for: ${packageName}`);

    // Only load from known packages to avoid webpack bundling issues
    let appModule;
    switch (packageName) {
      case "core":
        appModule = await import("@captify/core/app");
        break;
      default:
        console.warn(`Package ${packageName} not supported yet`);
        return null;
    }

    // Get the component and page registries from the app module
    const { pages, components } = appModule;

    if (pages || components) {
      console.log(
        `Successfully loaded component registry for package: ${packageName}`
      );
      // Return a function that provides the component for specific routes
      return async (routeName: string) => {
        // Try pages first, then components
        const pageLoader = pages?.[routeName as keyof typeof pages];
        if (pageLoader) {
          const loadedModule = await pageLoader();
          return loadedModule.default || loadedModule;
        }
        
        const componentLoader = components?.[routeName as keyof typeof components];
        if (componentLoader) {
          const loadedModule = await componentLoader();
          return loadedModule.default || loadedModule;
        }
        
        console.warn(`Route ${routeName} not found in package ${packageName}`);
        return null;
      };
    } else {
      console.warn(`Package ${packageName} registry not found`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to load package registry for ${packageName}:`, error);
    return null;
  }
}

export function PackagePageRouter() {
  const { packageConfig, packageState, setCurrentRoute } = usePackageContext();
  const [currentHash, setCurrentHash] = useState<string>("home");
  const [PageComponent, setPageComponent] =
    useState<React.ComponentType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Debug info
  console.log("PackagePageRouter render:", {
    packageConfig: packageConfig?.slug,
    currentHash,
    packageStateRoute: packageState.currentRoute,
    isLoading,
    hasPageComponent: !!PageComponent,
    loadError,
  });

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the #
      const newPage = hash || "home"; // Default to 'home' if no hash
      console.log("Hash changed:", {
        hash,
        newPage,
        currentLocation: window.location.href,
      });
      setCurrentHash(newPage);

      // Update package context
      if (newPage !== packageState.currentRoute) {
        console.log(
          "Updating package context route from",
          packageState.currentRoute,
          "to",
          newPage
        );
        setCurrentRoute(newPage);
      }
    };

    // Set initial hash
    console.log("Initial hash setup:", window.location.hash);
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [packageState.currentRoute, setCurrentRoute]);

  // Load page component when hash or package changes
  useEffect(() => {
    console.log("Page loading effect triggered:", {
      packageConfig: !!packageConfig,
      currentHash,
    });

    if (!packageConfig) {
      console.log("No package config, skipping page load");
      return;
    }

    const loadPage = async () => {
      console.log("Starting page load for:", currentHash);
      setIsLoading(true);
      setLoadError(null);
      setPageComponent(null);

      try {
        // Load the package registry
        const packageName = packageConfig.slug;
        const loadComponent = await loadPackageRegistry(packageName);

        if (!loadComponent) {
          throw new Error(`Package ${packageName} registry not found`);
        }

        // Get the page component from the registry
        console.log(`Getting page component for: ${currentHash}`);
        const component = await loadComponent(currentHash);

        if (component) {
          console.log(
            `Successfully loaded page component: ${packageName}/${currentHash}`
          );
          setPageComponent(() => component);
        } else {
          console.log(
            `Page ${currentHash} not found in package ${packageName}`
          );
          setLoadError(
            `Page "${currentHash}" not found in package "${packageName}"`
          );
          setPageComponent(null);
        }
      } catch (error) {
        console.error(`Error loading page:`, error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setLoadError(`Failed to load page "${currentHash}": ${errorMessage}`);
        setPageComponent(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [currentHash, packageConfig]);

  if (!packageConfig) {
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

  // Debug panel (temporary)
  const debugInfo = (
    <div className="bg-yellow-50 border border-yellow-200 p-3 m-4 rounded-md text-xs">
      <strong>Debug Info:</strong>
      <br />
      Package: {packageConfig?.slug}
      <br />
      Current Hash: {currentHash}
      <br />
      Package State Route: {packageState.currentRoute}
      <br />
      Is Loading: {isLoading.toString()}
      <br />
      Has Page Component: {(!!PageComponent).toString()}
      <br />
      Load Error: {loadError || "none"}
      <br />
      URL: {typeof window !== "undefined" ? window.location.href : "unknown"}
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {debugInfo}
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Loading Page</h3>
            <p className="text-muted-foreground">
              Loading {currentHash} from {packageConfig?.slug}...
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
        {debugInfo}
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
      {debugInfo}
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-2xl">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The page "{currentHash}" could not be found in package "
              {packageConfig.slug}".
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
                @captify/{packageConfig.slug} should export app.loadComponent
                function
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
