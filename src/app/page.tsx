"use client";

import React from "react";
import { PackagePageRouter } from "../components/packages/PackagePageRouter";
import { useCaptify } from "../components/providers/CaptifyProvider";

export default function HomePage() {
  const { session } = useCaptify();
  
  if (!session?.user) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Captify</h1>
          <p className="text-muted-foreground">Please log in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background">
      <PackagePageRouter 
        packageSlug="agent"
        packageName="Agent"
        currentHash="home"
      />
    </div>
  );
}