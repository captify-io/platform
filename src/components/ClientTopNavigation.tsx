"use client";

import { useState, useEffect } from "react";
import NextDynamic from "next/dynamic";
import { Session } from "next-auth";

// Client-side only TopNavigation to avoid SSR issues with hooks
const TopNavigation = NextDynamic(
  () =>
    import("@captify-io/core/components").then((mod) => ({
      default: mod.TopNavigation,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 bg-background border-b animate-pulse" />
    ),
  }
);

interface ClientTopNavigationProps {
  session: Session;
}

export function ClientTopNavigation({ session }: ClientTopNavigationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted) {
    return <div className="h-16 bg-background border-b" />;
  }

  return <TopNavigation session={session} />;
}
