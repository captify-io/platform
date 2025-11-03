"use client";

import { } from "@captify-io/core";
import { useEffect } from "react";

export default function FavoritesPage() {

  useEffect(() => {
    // Page is ready immediately
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Favorites</h1>
      <p className="text-muted-foreground">
        Your favorite items and shortcuts will appear here.
      </p>
    </div>
  );
}

export const dynamic = "force-dynamic";
