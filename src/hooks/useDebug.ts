"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Hook to check if debug mode is enabled via URL parameter
 * @returns boolean indicating if debug mode is active
 */
export function useDebug(): boolean {
  const [isDebug, setIsDebug] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const debugParam = searchParams.get("debug");
    setIsDebug(debugParam === "true");
  }, [searchParams]);

  return isDebug;
}
