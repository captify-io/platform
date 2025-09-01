"use client";

import { useSearchParams } from "next/navigation";
import { SessionDebug } from "@captify/core/components";
import { useDebug } from "@captify/core/hooks";
import { useCaptify } from "@captify/core/context";
import { useCallback } from "react";

export default function HomePage() {
  const searchParams = useSearchParams();
  const isDebugMode = useDebug(searchParams);
  const { session, isAuthenticated } = useCaptify();

  const updateSession = useCallback(async () => {
    // Session updates are handled by CaptifyContext
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {isDebugMode && (
        <SessionDebug
          session={session}
          isAuthenticated={isAuthenticated}
          status={isAuthenticated ? "authenticated" : "unauthenticated"}
          updateSession={updateSession}
        />
      )}
      <div className="flex items-center justify-center pt-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Captify Platform
          </h1>
          <p className="text-lg text-muted-foreground bg-muted p-4 rounded border">
            Multi-application platform with dynamic routing and AI capabilities
          </p>
        </div>
      </div>
    </div>
  );
}
