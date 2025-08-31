/**
 * Package Content Panel Component
 * Main area where package pages are rendered
 */

"use client";

import React, { Suspense } from "react";
import { usePackageContext } from "../context/PackageContext";
import { PackagePageRouter } from "./PackagePageRouter";

interface PackageContentPanelProps {
  children?: React.ReactNode;
}

export function PackageContentPanel({ children }: PackageContentPanelProps) {
  const { packageConfig, packageState } = usePackageContext();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">Content Area</h1>
          {packageConfig && (
            <div className="ml-auto text-sm text-muted-foreground">
              {packageConfig.name} • {packageState.currentRoute}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
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
          {children || <PackagePageRouter />}
        </Suspense>
      </div>
    </div>
  );
}
