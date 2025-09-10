"use client";

import React, { useEffect, useState, Suspense } from "react";

interface PackagePageRouterProps {
  currentHash?: string;
  packageSlug: string;
  packageName?: string;
}

type AppModule = {
  pageRegistry?: Record<string, () => Promise<any>>;
  componentRegistry?: Record<string, () => Promise<any>>;
};

const moduleCache: Record<string, AppModule> = {};

export function PackagePageRouter({
  currentHash: propCurrentHash,
  packageSlug,
  packageName = "App",
}: PackagePageRouterProps) {
  const [PageComponent, setPageComponent] =
    useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hashFromUrl, setHashFromUrl] = useState("home");

  // Track hash changes from URL
  useEffect(() => {
    const updateHash = () => {
      const raw = window.location.hash.replace(/^#/, "");
      setHashFromUrl(raw || "home");
    };
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  // Use prop hash if provided, otherwise use URL hash
  const currentHash = propCurrentHash || hashFromUrl;

  // Load module + page
  useEffect(() => {
    const loadPage = async () => {
      try {
        console.log(
          `[PackagePageRouter] Loading package="${packageSlug}" page="${currentHash}"`
        );

        // Load module from cache or import dynamically
        let appModule = moduleCache[packageSlug];
        if (!appModule) {
          console.log(`[PackagePageRouter] Importing @captify-io/${packageSlug}/app`);
          
          // Import the package main export (which contains pageRegistry)
          appModule = (await import(
            /* webpackIgnore: true */ `@captify-io/${packageSlug}/app`
          )) as AppModule;
          
          console.log(`[PackagePageRouter] ✅ Successfully imported @captify-io/${packageSlug}`);
          moduleCache[packageSlug] = appModule;
          console.log(`[PackagePageRouter] Cached module for ${packageSlug}`);
        }

        if (!appModule.pageRegistry) {
          throw new Error(`No page registry found in ${packageName}`);
        }

        console.log(
          `[PackagePageRouter] Available pages:`,
          Object.keys(appModule.pageRegistry)
        );

        const loader = appModule.pageRegistry[currentHash];
        if (!loader) {
          throw new Error(`Page "${currentHash}" not found in ${packageName}`);
        }

        console.log(`[PackagePageRouter] Loading component for "${currentHash}"`);
        const moduleResult = await loader();
        
        let Component: React.ComponentType | undefined;
        if ("default" in moduleResult && moduleResult.default) {
          Component = moduleResult.default;
        } else {
          const keys = Object.keys(moduleResult) as Array<keyof typeof moduleResult>;
          Component = moduleResult[keys[0]] as React.ComponentType;
        }

        if (Component) {
          console.log(`[PackagePageRouter] ✅ Component loaded successfully for "${currentHash}"`);
          setPageComponent(() => Component);
          setError(null);
        } else {
          throw new Error(`No component found in module for page "${currentHash}"`);
        }
      } catch (err) {
        console.error(`[PackagePageRouter] Failed to load page:`, err);
        setError(`Failed to load page: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadPage();
  }, [packageSlug, currentHash, packageName]);

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading {packageName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center max-w-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-destructive">
            Failed to Load {packageName}
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="bg-muted p-4 rounded-lg text-left text-sm">
            <p className="font-medium mb-2">Debug Info:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Check browser console for detailed logs</li>
              <li>• Ensure @captify-io/{packageSlug} is installed</li>
              <li>• Verify package exports configuration</li>
              <li>• Current route: {currentHash}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!PageComponent) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing component...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-auto">
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <PageComponent />
      </Suspense>
    </div>
  );
}
