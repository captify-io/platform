"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApps } from "../hooks/useApps";
import { App } from "../types";
import { Grid3X3, Star, Loader2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useCaptify } from "../context/CaptifyContext";

interface AppMarketProps {
  currentApplication?: {
    id: string;
    name: string;
  };
}

/**
 * AppMarket - A market/window for users to select and favorite applications
 * Simple, clean interface for app discovery and management
 */
export function AppMarket({ currentApplication }: AppMarketProps) {
  const router = useRouter();
  const { session } = useCaptify();
  const [marketOpen, setMarketOpen] = useState(false);

  // Use the apps hook to fetch applications
  const { applications, favoriteApps, isLoading, error } = useApps();

  const handleApplicationClick = (app: App) => {
    const appSlug = app.slug || app.appId;
    const href = `/apps/${appSlug}`;
    router.push(href);
    setMarketOpen(false);
  };

  const toggleFavorite = (appId: string) => {
    // TODO: Implement favorite toggling
    console.log("Toggle favorite for:", appId);
  };

  if (!session) {
    return null; // Don't show market if not authenticated
  }

  return (
    <>
      {/* Market Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setMarketOpen(true)}
        className="flex items-center gap-2"
      >
        <Grid3X3 className="h-4 w-4" />
        App Market
      </Button>

      {/* Market Modal/Popup */}
      {marketOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Application Market</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMarketOpen(false)}
              >
                ×
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading applications...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center py-8 text-destructive">
                  <AlertCircle className="h-6 w-6" />
                  <span className="ml-2">{error}</span>
                </div>
              )}

              {!isLoading && !error && applications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No applications available
                </div>
              )}

              {!isLoading && !error && applications.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {applications.map((app) => {
                    const isFavorite = favoriteApps.includes(app.appId);
                    const isCurrent = currentApplication?.id === app.appId;

                    return (
                      <div
                        key={app.appId}
                        className={`border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors ${
                          isCurrent ? "border-primary" : ""
                        }`}
                        onClick={() => handleApplicationClick(app)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium">{app.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(app.appId);
                            }}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                isFavorite
                                  ? "fill-yellow-400 text-yellow-400"
                                  : ""
                              }`}
                            />
                          </Button>
                        </div>
                        {app.description && (
                          <p className="text-sm text-muted-foreground">
                            {app.description}
                          </p>
                        )}
                        <div className="mt-2 text-xs text-muted-foreground">
                          Status: {app.status} • Version: {app.version}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
