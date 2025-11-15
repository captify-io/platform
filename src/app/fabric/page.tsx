/**
 * Fabric Application
 *
 * Captify-inspired living documentation with real-time collaboration
 */

"use client";

import { Fabric } from "@captify-io/core/components";
import { useState, useEffect } from "react";

export default function FabricPage() {
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load or create default space
  useEffect(() => {
    async function initializeSpace() {
      try {
        // TODO: Get user's default space or create one
        // For now, use a placeholder
        setSpaceId('space-default');
      } catch (error) {
        console.error('Failed to initialize space:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeSpace();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Fabric...</p>
        </div>
      </div>
    );
  }

  if (!spaceId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Space Found</h2>
          <p className="text-muted-foreground">
            Unable to load your workspace. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Fabric spaceId={spaceId} mode="full" />
    </div>
  );
}
