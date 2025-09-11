"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { captifyApps } from "@/.captify.generated"; // <-- auto-generated file

type LoaderResult<T = any> = { default?: T } & Record<string, any>;
type PageLoader = () => Promise<LoaderResult<React.ComponentType>>;

type CaptifyAppPackage = {
  pageRegistry: Record<string, PageLoader>;
};

function parseHash(raw: string | null): string {
  if (!raw) return "home";
  const clean = raw.replace(/^#/, "");
  const page = clean.split(/[/?]/)[0]?.trim();
  return page || "home";
}

interface PackagePageRouterProps {
  packageSlug?: string; // optional override; otherwise from URL (/pmbook)
  packageName?: string;
  currentHash?: string; // optional override for hash
}

export function PackagePageRouter({
  packageSlug: propPackageSlug,
  packageName = "App",
  currentHash: propCurrentHash,
}: PackagePageRouterProps) {
  const pathname = usePathname();

  // Determine slug from first path segment if not provided
  const slug = useMemo(() => {
    if (propPackageSlug) return propPackageSlug;
    const parts = (pathname || "").split("/").filter(Boolean);
    return parts[0] || "";
  }, [propPackageSlug, pathname]);

  const [hashFromUrl, setHashFromUrl] = useState("home");
  const [PageComponent, setPageComponent] =
    useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateHash = () => setHashFromUrl(parseHash(window.location.hash));
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const pageKey = useMemo(
    () => (propCurrentHash ? parseHash(propCurrentHash) : hashFromUrl),
    [propCurrentHash, hashFromUrl]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setPageComponent(null);

        if (!slug) {
          throw new Error(
            "No package slug found in URL (expected /<slug>) and none provided."
          );
        }

        // Get loader from generated registry
        const pkgLoader = captifyApps[slug];
        if (!pkgLoader) {
          throw new Error(
            `No captify app found for slug "${slug}". Is @captify-io/${slug} installed and exposing "./app"?`
          );
        }

        // Load the package app entry
        const mod = (await pkgLoader()) as CaptifyAppPackage;

        const { pageRegistry } = mod || {};
        if (!pageRegistry || typeof pageRegistry !== "object") {
          throw new Error(
            `@captify-io/${slug}/app did not export a valid pageRegistry.`
          );
        }

        const loader =
          pageRegistry[pageKey] ??
          pageRegistry["home"] ??
          pageRegistry["dashboard"];

        if (!loader) {
          const available = Object.keys(pageRegistry);
          throw new Error(
            `Page "${pageKey}" not found for "${slug}".` +
              (available.length
                ? ` Available: ${available.join(", ")}`
                : " No pages exported.")
          );
        }

        const pageMod = await loader();
        const Component = pageMod.default as React.ComponentType | undefined;
        if (!Component) {
          throw new Error(
            `Loaded page "${pageKey}" but it did not export a default React component.`
          );
        }

        if (!cancelled) setPageComponent(() => Component);
      } catch (err) {
        if (!cancelled) setError((err as Error).message || "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, pageKey]);

  // UI states
  if (!slug) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center max-w-2xl p-6">
          <h2 className="text-2xl font-bold mb-2 text-destructive">
            Error Loading {packageName}
          </h2>
          <p className="text-muted-foreground">No package slug found.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading {slug}#{pageKey}…
          </p>
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
            <p className="font-medium mb-2">Debug Info:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Package: @captify-io/{slug}/app</li>
              <li>• Page: {pageKey}</li>
              <li>• Check browser console for details</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!PageComponent) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Initializing page…</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-auto">
      <PageComponent />
    </div>
  );
}
