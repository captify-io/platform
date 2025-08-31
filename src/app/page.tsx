"use client";

import { SessionDebug } from "@/components/SessionDebug";
import { useDebug } from "@/hooks";

export default function HomePage() {
  const isDebugMode = useDebug();

  return (
    <div className="min-h-screen bg-background">
      {isDebugMode && <SessionDebug />}
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
