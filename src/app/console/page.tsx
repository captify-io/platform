"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useConsoleBreadcrumbs } from "@/hooks/useConsoleBreadcrumbs";
import { ConsoleLayout } from "@/components/apps/console/ConsoleLayout";

export default function ConsolePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();

  // Set up smart breadcrumbs for the console
  const { threadData } = useConsoleBreadcrumbs();

  useEffect(() => {
    // Extract thread ID from URL hash if present (for deep links)
    const extractThreadFromHash = () => {
      if (typeof window !== "undefined") {
        const hash = window.location.hash;
        if (hash.startsWith("#thread?")) {
          const urlParams = new URLSearchParams(hash.replace("#thread?", ""));
          const threadId = urlParams.get("id");
          setCurrentThreadId(threadId || undefined);
        } else {
          // No thread hash, clear current thread
          setCurrentThreadId(undefined);
        }
      }
    };

    // Initial extraction
    extractThreadFromHash();

    // Listen for hash changes
    const handleHashChange = () => {
      extractThreadFromHash();
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleThreadChange = (threadId: string) => {
    setCurrentThreadId(threadId);
    // Update URL hash without page reload
    if (typeof window !== "undefined") {
      const newHash = `#thread?id=${threadId}`;
      window.location.hash = newHash;
    }
  };

  const handleClearThread = () => {
    setCurrentThreadId(undefined);
    // Clear hash to return to main console view
    if (typeof window !== "undefined") {
      window.location.hash = "";
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show authentication prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Welcome to Captify Console</h2>
          <p className="text-muted-foreground">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ConsoleLayout
        threadId={currentThreadId}
        onThreadChange={handleThreadChange}
      />
    </div>
  );
}
