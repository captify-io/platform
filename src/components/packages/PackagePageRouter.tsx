/**
 * Package Page Router Component
 *
 * Dynamically loads and renders pages from package modules based on URL hash.
 *
 * Features:
 * - Hash-based routing (e.g., #dashboard, #settings, #reports)
 * - Dynamic module loading with caching
 * - Fallback to home page for missing routes
 * - Complex hash parsing (handles #page/subpage, #page?param=value)
 * - Error handling with helpful debugging information
 *
 * Usage:
 * ```tsx
 * <PackagePageRouter
 *   packageSlug="pmbook"
 *   packageName="PMBook"
 *   currentHash="dashboard" // Optional: override URL hash
 * />
 * ```
 *
 * URL Examples:
 * - example.com/#dashboard → loads "dashboard" page
 * - example.com/#settings/profile → loads "settings" page
 * - example.com/#reports?type=monthly → loads "reports" page
 * - example.com/#invalid → falls back to "home" page
 */

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
      // Handle complex hash parsing (e.g., #page/subpage or #page?param=value)
      const pageName = raw.split(/[\/\?]/)[0] || "home";
      setHashFromUrl(pageName);
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
          console.log(
            `[PackagePageRouter] Importing @captify-io/${packageSlug}/app`
          );
          appModule = (await import("@captify-io/pmbook/app")) as AppModule;
          console.log("[HomePage] ✅ Successfully imported @captify-io/pmbook");

          moduleCache["pmbook"] = appModule;
          console.log("[HomePage] Cached pmbook module");

          console.log(
            `[PackagePageRouter] ✅ Successfully imported @captify-io/${packageSlug}`
          );
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
          // Try to fall back to home page if the requested page doesn't exist
          const homeLoader = appModule.pageRegistry["home"];
          if (homeLoader && currentHash !== "home") {
            console.warn(
              `[PackagePageRouter] Page "${currentHash}" not found, falling back to home`
            );
            const moduleResult = await homeLoader();
            let Component: React.ComponentType | undefined;
            if ("default" in moduleResult && moduleResult.default) {
              Component = moduleResult.default;
            } else {
              const keys = Object.keys(moduleResult) as Array<
                keyof typeof moduleResult
              >;
              Component = moduleResult[keys[0]] as React.ComponentType;
            }

            if (Component) {
              console.log(
                `[PackagePageRouter] ✅ Fallback to home component loaded successfully`
              );
              setPageComponent(() => Component);
              setError(null);
              return;
            }
          }

          const availablePages = Object.keys(appModule.pageRegistry);
          throw new Error(
            `Page "${currentHash}" not found in ${packageName}. ` +
              `Available pages: ${availablePages.join(", ")}`
          );
        }

        console.log(
          `[PackagePageRouter] Loading component for "${currentHash}"`
        );
        const moduleResult = await loader();

        let Component: React.ComponentType | undefined;
        if ("default" in moduleResult && moduleResult.default) {
          Component = moduleResult.default;
        } else {
          const keys = Object.keys(moduleResult) as Array<
            keyof typeof moduleResult
          >;
          Component = moduleResult[keys[0]] as React.ComponentType;
        }

        if (Component) {
          console.log(
            `[PackagePageRouter] ✅ Component loaded successfully for "${currentHash}"`
          );
          setPageComponent(() => Component);
          setError(null);
        } else {
          throw new Error(
            `No component found in module for page "${currentHash}"`
          );
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
              <li>• Current route: #{currentHash}</li>
              <li>• Package: {packageSlug}</li>
              <li>• URL hash: {window.location.hash}</li>
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
