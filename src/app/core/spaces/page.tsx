"use client";

import { useCaptify } from "@captify-io/core/components";
import { useEffect } from "react";

export default function SpacesPage() {
  const { setPageReady } = useCaptify();

  useEffect(() => {
    // Page is ready immediately
    setPageReady();
  }, [setPageReady]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Spaces</h1>
      <p className="text-muted-foreground">
        Manage your spaces and workspaces here.
      </p>
    </div>
  );
}

export const dynamic = "force-dynamic";
