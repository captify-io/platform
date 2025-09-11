"use client";

import React, { useEffect, useState } from "react";

interface PackagePageRouterProps {
  currentHash?: string;
  packageSlug: string;
  packageName?: string;
}

function parseHash(raw: string | null): string {
  if (!raw) return "home";
  const clean = raw.replace(/^#/, "");
  const page = clean.split(/[/?]/)[0]?.trim();
  return page || "home";
}

export function PackagePageRouter({
  currentHash: propCurrentHash,
  packageSlug,
  packageName = "App",
}: PackagePageRouterProps) {
  const [hashFromUrl, setHashFromUrl] = useState("home");
  const [PageComponent, setPageComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log("hash", hashFromUrl);
  
  // Track hash changes from URL
  useEffect(() => {
    const updateHash = () => {
      const raw = window.location.hash.replace(/^#/, "");
      const pageName = raw.split(/[/?]/)[0] || "home";
      setHashFromUrl(pageName);
    };
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  // Use prop hash if provided, otherwise use URL hash
  const currentHash = propCurrentHash || hashFromUrl;

  // Load page component when hash changes
  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[PackagePageRouter] Loading package: ${packageSlug}, page: ${currentHash}`);
        
        // Dynamic import of the package
        const packageModule = await import(`@captify-io/${packageSlug}`);
        console.log(`[PackagePageRouter] Package module loaded:`, packageModule);
        
        // Get the pageRegistry from the package
        const { pageRegistry } = packageModule;
        
        if (!pageRegistry) {
          throw new Error(`Package "@captify-io/${packageSlug}" does not export a pageRegistry`);
        }
        
        console.log(`[PackagePageRouter] Available pages:`, Object.keys(pageRegistry));
        
        let pageLoader;
        
        // Map hash to page registry keys
        if (currentHash === "home" || currentHash === "dashboard") {
          // Default to home page
          pageLoader = pageRegistry['home'] || pageRegistry['dashboard'];
        } else if (currentHash === "ops-insights") {
          pageLoader = pageRegistry['ops-insights'];
        } else {
          // Try the hash directly as a key
          pageLoader = pageRegistry[currentHash];
        }
        
        if (!pageLoader) {
          throw new Error(`Page "${currentHash}" not found in page registry. Available pages: ${Object.keys(pageRegistry).join(', ')}`);
        }
        
        console.log(`[PackagePageRouter] Found page loader for: ${currentHash}`);
        
        // Load page dynamically
        const { default: Component } = await pageLoader();
        
        console.log(`[PackagePageRouter] ✅ Page loaded successfully: ${currentHash}`);
        
        setPageComponent(() => Component);
      } catch (err) {
        console.error(`[PackagePageRouter] Failed to load package/page:`, err);
        
        const errorMessage = (err as Error).message;
        
        // Provide helpful error messages for common issues
        if (errorMessage.includes('Cannot resolve module') || errorMessage.includes('Module not found')) {
          setError(`Package "@captify-io/${packageSlug}" is not installed or available. Please ensure the package is properly installed.`);
        } else {
          setError(`Failed to load ${packageSlug}/${currentHash}: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [currentHash, packageSlug]);

  // Return early if no package slug
  if (!packageSlug) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center max-w-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-destructive">
            Error Loading {packageName}
          </h2>
          <p className="text-muted-foreground">No package specified</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading {currentHash}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center max-w-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-destructive">
            Page Load Error
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="bg-muted p-4 rounded-lg text-left text-sm">
            <p className="font-medium mb-2">Available pages:</p>
            <ul className="space-y-1 text-muted-foreground">
              {Object.keys(pageRegistry).map(key => (
                <li key={key}>• {key}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!PageComponent) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Initializing page...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-auto">
      <PageComponent />
    </div>
  );
}
