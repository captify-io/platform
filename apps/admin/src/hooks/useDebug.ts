/**
 * Debug mode detection hook
 */

"use client";

import { useEffect, useState } from "react";

/**
 * Hook to check if debug mode is enabled via URL parameter
 * @param searchParams - Injected search params from Next.js useSearchParams hook
 * @returns boolean indicating if debug mode is active
 */
export function useDebug(searchParams: URLSearchParams | null): boolean {
  const [isDebug, setIsDebug] = useState(false);

  useEffect(() => {
    if (searchParams) {
      const debugParam = searchParams.get("debug");
      setIsDebug(debugParam === "true");
    }
  }, [searchParams]);

  return isDebug;
}
