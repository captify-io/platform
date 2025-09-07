/**
 * React components for package rendering
 */
"use client";

import { ComponentType, lazy, Suspense } from "react";
import { getPackageLoader } from "./PackageRegistry";

/**
 * Component that renders a package app with error boundaries
 */
interface PackageRendererProps {
  packageName: string;
  params?: any;
}

export function PackageRenderer({ packageName, params }: PackageRendererProps) {
  // Use static registry for package loading
  const PackageComponent = lazy(() => {
    const packageLoader = getPackageLoader(packageName);

    if (!packageLoader) {
      return Promise.resolve({
        default: () => (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">
              Package: {packageName}
            </h2>
            <p className="text-muted-foreground">
              Package @captify/{packageName} not found in registry
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Available packages: core, mi
            </p>
          </div>
        ),
      });
    }

    return packageLoader()
      .then((packageModule) => {
        if (!packageModule) {
          throw new Error(`Package @captify/${packageName} not available`);
        }

        // Try to get the main app component from the package
        if (packageModule.default) {
          return { default: packageModule.default };
        } else if (packageModule.App) {
          return { default: packageModule.App };
        } else if (packageModule[`${packageName}App`]) {
          return { default: packageModule[`${packageName}App`] };
        } else {
          // Fallback component if no main component is found
          return {
            default: () => (
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2">
                  Package: {packageName}
                </h2>
                <p className="text-muted-foreground">
                  No main component found in @captify/{packageName}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Expected exports: default, App, or {packageName}App
                </p>
              </div>
            ),
          };
        }
      })
      .catch((error) => {
        console.error(`Failed to load package @captify/${packageName}:`, error);
        // Error fallback component
        return {
          default: () => (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2 text-red-700">
                Error Loading Package: {packageName}
              </h2>
              <p className="text-red-600 mb-2">
                Failed to load @captify/{packageName}
              </p>
              <details className="text-sm text-red-600">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                  {error.toString()}
                </pre>
              </details>
            </div>
          ),
        };
      });
  });

  return (
    <Suspense
      fallback={
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Loading {packageName} package...
          </p>
        </div>
      }
    >
      <PackageComponent {...params} />
    </Suspense>
  );
}
