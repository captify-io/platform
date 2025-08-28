"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Grid3X3, Star, StarIcon, X } from "lucide-react";
import { DynamicIcon } from "./ui/dynamic-icon";
import { useRouter } from "next/navigation";
import { CaptifyClient } from "../lib/api"
import { UserState, App } from "../types";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { useCaptify } from "../context/CaptifyContext";

// Category-based color mappings
const getCategoryColor = (category?: string) => {
  const categoryColors = {
    platform: "#3b82f6", // blue
    management: "#10b981", // emerald
    communication: "#f59e0b", // amber
    analytics: "#8b5cf6", // violet
    development: "#ef4444", // red
    administration: "#dc2626", // red-600
    operations: "#059669", // emerald-600
    utility: "#6b7280", // gray
    default: "#6366f1", // indigo
  };

  return (
    categoryColors[category?.toLowerCase() as keyof typeof categoryColors] ||
    categoryColors.default
  );
};

// Get app icon with fallback
const getAppIcon = (app: any) => {
  // Try to get icon from config first, then fallback to app icon property, then default
  return app.config?.icon || app.icon || "Bot";
};

interface ApplicationLauncherProps {
  className?: string;
}

interface AppCardProps {
  app: any;
  isFavorite: boolean;
  onToggleFavorite: (appId: string) => void;
  onAppClick?: (app: any) => void;
}

const AppCard: React.FC<AppCardProps> = ({
  app,
  isFavorite,
  onToggleFavorite,
  onAppClick,
}) => {
  const categoryColor = getCategoryColor(app.category);
  const appIcon = getAppIcon(app);

  return (
    <div
      className="relative group hover:bg-gray-800/50 transition-all duration-200 h-[75px] p-[5px] rounded-lg cursor-pointer"
      onClick={() => onAppClick?.(app)}
    >
      <div className="flex items-center gap-3 h-full">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          <div style={{ color: categoryColor }}>
            <DynamicIcon name={appIcon} className="w-5 h-5" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate text-white">
              {app.name || app.appId}
            </h3>
            {app.version && (
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-300"
              >
                v{app.version}
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
            {app.description || "No description available"}
          </p>
          {app.category && (
            <span className="inline-block text-xs text-gray-500 mt-1">
              {app.category}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onToggleFavorite(app.appId);
          }}
          className="shrink-0 w-8 h-8 p-0 hover:bg-gray-700"
        >
          {isFavorite ? (
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ) : (
            <StarIcon className="w-4 h-4 text-gray-400 hover:text-yellow-400 transition-colors" />
          )}
        </Button>
      </div>
    </div>
  );
};

export function ApplicationLauncher({ className }: ApplicationLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [applications, setApplications] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session, favoriteApps, toggleFavorite, favoritesLoading } =
    useCaptify();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Fetch applications only when sheet is opened
  const fetchApps = useCallback(async () => {
    if (!session) {
      setError("Authentication required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("ApplicationLauncher: Fetching apps with session:", {
        userId: session.user?.email,
        hasUser: !!session.user,
      });

      // Create authenticated client
      const captify = new CaptifyClient({
        appId: "core",
        session: session,
      });

      // Fetch applications from captify-core-App table
      const applicationsResponse = await captify.get({
        table: "captify-core-App",
        params: {
          filterExpression: "attribute_exists(appId)",
          limit: 50,
        },
      });

      if (!applicationsResponse.success) {
        console.error(
          "Failed to fetch applications:",
          applicationsResponse.error
        );
        throw new Error(
          applicationsResponse.error || "Failed to fetch applications"
        );
      }

      console.log(
        "ApplicationLauncher: Raw applications response:",
        applicationsResponse.data
      );

      // Handle both data structures: direct array or Items array
      const applications = Array.isArray(applicationsResponse.data)
        ? applicationsResponse.data
        : applicationsResponse.data?.Items || [];

      console.log("ApplicationLauncher: Processed applications:", applications);
      setApplications(applications);
    } catch (err) {
      console.error("Error fetching apps:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Fetch data when sheet opens
  useEffect(() => {
    if (isOpen && applications.length === 0) {
      fetchApps();
    }
  }, [isOpen, applications.length, fetchApps]);

  const handleToggleFavorite = async (appId: string) => {
    if (!session) return;

    // Use the centralized toggle method from CaptifyContext
    await toggleFavorite(appId);
  };

  const handleAppClick = (app: App) => {
    const appSlug = app.slug;
    const hasDirectRoute = ["mi", "console"].includes(appSlug);
    const href = hasDirectRoute ? `/${appSlug}` : `/app/${appSlug}`;

    router.push(href);
    setIsOpen(false); // Close the panel after navigation
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`text-white hover:bg-gray-800 hover:text-white p-2 cursor-pointer ${
          className || ""
        }`}
      >
        <Grid3X3 className="h-5 w-5" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed left-0 top-0 bottom-0 z-50 w-[400px] bg-gray-900 border-r border-gray-800 shadow-lg">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">
                  Applications
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="space-y-[5px]">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-[75px] p-[5px]">
                        <div className="flex items-center gap-3 h-full">
                          <Skeleton className="w-10 h-10 rounded-lg bg-gray-700" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24 bg-gray-700" />
                            <Skeleton className="h-3 w-full bg-gray-700" />
                          </div>
                          <Skeleton className="w-8 h-8 bg-gray-700" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">{error}</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No applications found</p>
                  </div>
                ) : (
                  <div className="space-y-[5px]">
                    {applications.map((app: App) => (
                      <AppCard
                        key={app.appId}
                        app={app}
                        isFavorite={favoriteApps.includes(app.appId)}
                        onToggleFavorite={handleToggleFavorite}
                        onAppClick={handleAppClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
