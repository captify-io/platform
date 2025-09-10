"use client";

import { useState, useEffect } from "react";
import NextDynamic from "next/dynamic";

// Client-side only ThreePanelLayout to avoid SSR issues with hooks
const ThreePanelLayout = NextDynamic(
  () =>
    import("./layout/ThreePanelLayout").then((mod) => ({
      default: mod.ThreePanelLayout,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-background animate-pulse" />
    ),
  }
);

export function ClientThreePanelLayout(props: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted) {
    return <div className="h-full w-full bg-background" />;
  }

  return <ThreePanelLayout {...props} />;
}
