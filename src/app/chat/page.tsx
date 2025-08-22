"use client";

import { useState, useEffect } from "react";
import { ConsoleLayout, useBreadcrumbs } from "@captify/chat";

export default function ConsolePage() {
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>();

  // Set up smart breadcrumbs for the console
  const { threadData } = useBreadcrumbs();

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

  return (
    <div className="h-full w-full">
      <ConsoleLayout
        threadId={currentThreadId}
        onThreadChange={handleThreadChange}
      />
    </div>
  );
}
