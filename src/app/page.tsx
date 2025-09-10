"use client";

import React, { useEffect, useState, Suspense } from "react";
import type { AppModule } from "@/types/captify-packages";

const moduleCache: Record<string, AppModule> = {};

function PmbookHomePage() {
  const [PageComponent, setPageComponent] =
    useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPmbookHome = async () => {
      try {
        console.log("[HomePage] Loading pmbook home page");

        // Load pmbook app module
        let appModule = moduleCache["pmbook"];
        if (!appModule) {
          console.log("[HomePage] Importing @captify-io/pmbook/app");

          // Import the pmbook main export (which contains pageRegistry)
          appModule = (await import("@captify-io/pmbook/app")) as AppModule;
          console.log("[HomePage] ✅ Successfully imported @captify-io/pmbook");

          moduleCache["pmbook"] = appModule;
          console.log("[HomePage] Cached pmbook module");
        }

        if (!appModule.pageRegistry) {
          throw new Error("No page registry found in pmbook");
        }

        console.log(
          "[HomePage] Available pages:",
          Object.keys(appModule.pageRegistry)
        );

        // Load the home page
        const homeLoader = appModule.pageRegistry["home"];
        if (!homeLoader) {
          throw new Error("Home page not found in pmbook registry");
        }

        console.log("[HomePage] Loading home component");
        const moduleResult = await homeLoader();
        let Component: React.ComponentType | undefined;
        if ("default" in moduleResult && moduleResult.default) {
          Component = moduleResult.default;
        } else {
          const keys = Object.keys(moduleResult) as Array<keyof typeof moduleResult>;
          Component = moduleResult[keys[0]] as React.ComponentType;
        }

        if (Component) {
          console.log("[HomePage] ✅ Home component loaded successfully");
          setPageComponent(() => Component);
          setError(null);
        } else {
          throw new Error("No component found in home page module");
        }
      } catch (err) {
        console.error("[HomePage] Failed to load pmbook home:", err);
        setError(`Failed to load pmbook home: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    loadPmbookHome();
  }, []);

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading PMBook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center max-w-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-destructive">
            Failed to Load PMBook
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="bg-muted p-4 rounded-lg text-left text-sm">
            <p className="font-medium mb-2">Debug Info:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Check browser console for detailed logs</li>
              <li>• Ensure @captify-io/pmbook is installed</li>
              <li>• Verify package exports configuration</li>
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

export default function HomePage() {
  return <PmbookHomePage />;
}
