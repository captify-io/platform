/**
 * Package Content Panel Component
 * Main area where package pages are rendered
 */

"use client";

import React, { Suspense, useEffect, useRef } from "react";
import { PackagePageRouter } from "./PackagePageRouter";
import { PackageContentPanelProps } from "../../types/package";

export function PackageContentPanel({
  children,
  currentHash,
  packageSlug,
  packageName,
}: PackageContentPanelProps) {
  const prevHashRef = useRef<string | undefined>(undefined);

  // Track hash changes
  useEffect(() => {
    try {
      // Only run on client side and ensure ref is available
      if (
        typeof window !== "undefined" &&
        prevHashRef.current !== currentHash
      ) {
        prevHashRef.current = currentHash;
      }
    } catch (error) {
      console.warn("Hash tracking failed:", error);
    }
  }, [currentHash]);

  return (
    <div className="flex flex-col h-full">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading content...</p>
              </div>
            </div>
          }
        >
          <PackagePageRouter
            currentHash={currentHash}
            packageSlug={packageSlug}
            packageName={packageName}
          />
        </Suspense>
      </div>
    </div>
  );
}
