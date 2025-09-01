"use client";

import dynamic from "next/dynamic";

// Dynamically import CaptifyLayout with SSR disabled
const CaptifyLayout = dynamic(
  () => import("@captify/core/components").then((mod) => ({ default: mod.CaptifyLayout })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
);

interface ClientWrapperProps {
  children: React.ReactNode;
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  return <CaptifyLayout>{children}</CaptifyLayout>;
}
