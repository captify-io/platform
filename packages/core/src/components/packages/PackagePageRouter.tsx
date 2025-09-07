'use client';

import React, { useEffect, useState, Suspense } from "react";
import { loadPackageRegistry } from "./PackageRegistry";
import { apiClient } from "../../lib/api";

interface PackagePageRouterProps {
  currentHash?: string;
  packageSlug?: string;
  packageName?: string;
}

export function PackagePageRouter({
  currentHash = "home",
  packageSlug = "core",
  packageName = "Core"
}: PackagePageRouterProps) {
  const [PageComponent, setPageComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Identity pool will be set from app data loaded from DynamoDB
  React.useLayoutEffect(() => {
    // Identity pool management moved to DynamoDB-based app data
    console.log(`[PackagePageRouter] Package: ${packageSlug}, Hash: ${currentHash}`);
  }, [packageSlug, currentHash]); // Re-run when hash changes too

  useEffect(() => {
    const loadPage = async () => {
      try {
        console.log(`[PackagePageRouter] Loading page: packageSlug="${packageSlug}", currentHash="${currentHash}"`);
        const loadComponent = await loadPackageRegistry(packageSlug);
        if (!loadComponent) {
          console.warn(`[PackagePageRouter] Package ${packageSlug} not found in registry`);
          setError(`Package ${packageSlug} not found`);
          return;
        }

        console.log(`[PackagePageRouter] Package registry loaded, attempting to load component for "${currentHash}"`);
        const component = await loadComponent(currentHash);
        if (component) {
          console.log(`[PackagePageRouter] Successfully loaded component for "${currentHash}"`);
          setPageComponent(() => component);
          setError(null);
        } else {
          console.warn(`[PackagePageRouter] Component not found for route "${currentHash}"`);
          setError(`Page "${currentHash}" not found`);
        }
      } catch (err) {
        console.error(`[PackagePageRouter] Error loading page:`, err);
        setError(`Failed to load page: ${err}`);
      }
    };

    loadPage();
  }, [currentHash, packageSlug]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!PageComponent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <PageComponent />
    </Suspense>
  );
}