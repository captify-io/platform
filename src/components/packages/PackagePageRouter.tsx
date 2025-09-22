"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamic import for pmbook PageRouter
const PageRouter = dynamic(
  () => import("@captify-io/pmbook").catch((err) => {
    console.error("Failed to load @captify-io/pmbook:", err);
    // Return a fallback component
    return {
      default: ({ href }: { href: string }) => (
        <div className="h-full bg-background flex items-center justify-center">
          <div className="text-center max-w-2xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-destructive">
              Package Not Available
            </h2>
            <p className="text-muted-foreground mb-4">
              The pmbook package is not available in development mode.
            </p>
            <p className="text-sm text-muted-foreground">
              Route: {href}
            </p>
          </div>
        </div>
      )
    };
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    ),
  }
);

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

  useEffect(() => {
    const updateHash = () => setHashFromUrl(parseHash(window.location.hash));
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const currentHash = useMemo(
    () => (propCurrentHash ? parseHash(propCurrentHash) : hashFromUrl),
    [propCurrentHash, hashFromUrl]
  );

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

  if (slug !== "pmbook") {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center max-w-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-destructive">
            Package Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            Package "{slug}" not found. Available packages: pmbook
          </p>
        </div>
      </div>
    );
  }

  // Custom loading fallback for the package router
  const customFallback = (
    <div className="h-full bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          Loading {slug}#{currentHash}…
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-background overflow-auto">
      <PageRouter href={currentHash} fallback={customFallback} />
    </div>
  );
}
