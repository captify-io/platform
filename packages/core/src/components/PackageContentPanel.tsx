/**
 * Package Content Panel Component
 * Main area where package pages are rendered
 */

"use client";

import React, { Suspense, useEffect, useRef } from "react";
import { useCaptify } from "../context/CaptifyContext";
import { PackagePageRouter } from "./PackagePageRouter";

interface PackageContentPanelProps {
  children?: React.ReactNode;
  currentHash?: string;
}

export function PackageContentPanel({
  children,
  currentHash,
}: PackageContentPanelProps) {
  const { packageConfig, packageState } = useCaptify();
  const prevHashRef = useRef<string | undefined>(undefined);

  // Track hash changes
  useEffect(() => {
    if (prevHashRef.current !== currentHash) {
      prevHashRef.current = currentHash;
    }
  }, [currentHash]);

  return (
    <div className="flex flex-col h-full">
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
          <PackagePageRouter currentHash={currentHash} />
        </Suspense>
      </div>
    </div>
  );
}
