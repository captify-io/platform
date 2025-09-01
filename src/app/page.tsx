"use client";

import { useSearchParams } from "next/navigation";
import { SessionDebug } from "@captify/core/components";
import { useDebug } from "@captify/core/hooks";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

export default function HomePage() {
  const searchParams = useSearchParams();
  const isDebugMode = useDebug(searchParams);
  const { data: session, status, update } = useSession();

  const updateSession = useCallback(async () => {
    await update();
  }, [update]);

  return (
    <div className="min-h-screen bg-background">
      {isDebugMode && (
        <SessionDebug
          session={session}
          isAuthenticated={status === "authenticated"}
          status={status}
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
