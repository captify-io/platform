"use client";

import React from "react";
import { useCallback, useEffect } from "react";
import { useState } from "../../lib/react-compat";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@captify/core/lib";
import {
  Button,
  Badge,
  ScrollArea,
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@captify/core/ui";
import { DynamicIcon } from "lucide-react/dynamic";
import { App, AppCategory, APP_CATEGORY_LABELS } from "../../types";
import { useDebug } from "../../hooks";
import { useFavorites } from "@captify/core/hooks";
import { Grid3X3, Star, Search } from "lucide-react";
import type { Session } from "next-auth";
import { cn } from "../../lib/utils";

interface ApplicationLauncherProps {
  className?: string;
  session: Session | null;
}

type FilterType =
  | "favorites"
  | "all-applications"
  | "all-services"
  | AppCategory;

// Left sidebar navigation item component
function NavItem({
  label,
  icon,
  isActive,
  count,
  onClick,
  type = "default",
}: {
  label: string;
  icon: string;
  isActive: boolean;
  count?: number;
  onClick: () => void;
  type?: "default" | "divider-after";
}) {
  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
          isActive
            ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        )}
      >
        <div className="flex items-center gap-2">
          <DynamicIcon name={icon as any} className="h-4 w-4" />
          <span>{label}</span>
        </div>
        {count !== undefined && (
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        )}
      </button>
      {type === "divider-after" && (
        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
      )}
    </>
  );
}

// Application card component for right panel
function AppCard({
  app,
  isFavorite,
  onToggleFavorite,
  onAppClick,
}: {
  app: App;
  isFavorite: boolean;
  onToggleFavorite: (appId: string) => void;
  onAppClick: (app: App) => void;
}) {
  return (
    <div
      className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all duration-200 bg-white dark:bg-gray-800"
      onClick={() => onAppClick(app)}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-gray-200 dark:border-gray-600 flex-shrink-0">
          <DynamicIcon
            name={(app.icon || "package") as any}
            className="h-6 w-6 text-blue-600"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 truncate pr-2">
              {app.name}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onToggleFavorite(app.id);
              }}
              className={cn(
                "h-8 w-8 p-0 transition-all duration-200 flex-shrink-0",
                isFavorite
                  ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                  : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              )}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={cn("h-4 w-4", isFavorite ? "fill-current" : "")}
              />
            </Button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
            {app.description || "No description available"}
          </p>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {APP_CATEGORY_LABELS[app.category as AppCategory] || app.category}
            </Badge>
            <span
              className={cn(
                "text-xs px-2 py-1 rounded-full",
                app.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              )}
            >
              {app.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApplicationLauncherAWS({
  className,
  session,
}: ApplicationLauncherProps) {
  const searchParams = useSearchParams();
  const isDebugMode = useDebug(searchParams);
  const [isOpen, setIsOpen] = useState(false);
  const [applications, setApplications] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("favorites");
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const { favoriteApps, toggleFavorite, isFavorite } = useFavorites();

  // Fetch applications from DynamoDB
  const fetchApplications = useCallback(async () => {
    if (!session) {
      setError("Authentication required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.run({
        service: "dynamo",
        operation: "scan",
        app: "core",
        table: "App",
        data: {
          limit: 100,
        },
      });

      if (!response.success) {
        setError(response.error || "Failed to fetch applications");
        return;
      }

      const apps = response.data?.Items || [];

      if (isDebugMode) {
        console.log("🔍 ApplicationLauncher Debug:");
        console.log("  Applications loaded:", apps.length);
        console.log("  Applications:", apps);
      }

      setApplications(apps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [session, isDebugMode]);

  // Navigate to app
  const navigateToApp = useCallback(
    (app: App) => {
      const appRoute = `/${app.slug}`;
      router.push(appRoute);
      setIsOpen(false);
    },
    [router]
  );

  // Get category counts
  const categoryStats = applications.reduce(
    (acc: Record<string, number>, app: App) => {
      const category = app.category || "other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Filter applications based on active filter and search
  const filteredApplications = applications.filter((app: App) => {
    // Filter by category/type
    let matchesFilter = false;

    switch (activeFilter) {
      case "favorites":
        matchesFilter = isFavorite(app.id);
        break;
      case "all-applications":
      case "all-services":
        matchesFilter = true;
        break;
      default:
        // Category filter
        matchesFilter = app.category === activeFilter;
    }

    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Ensure component only renders on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load data when opened
  useEffect(() => {
    if (isOpen && session?.user) {
      fetchApplications();
    }
  }, [isOpen, session?.user, fetchApplications]);

  // Render loading state while mounting
  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`text-white hover:bg-gray-800 hover:text-white p-2 ${
          className || ""
        }`}
      >
        <Grid3X3 className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`text-white hover:bg-gray-800 hover:text-white p-2 ${
            className || ""
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="min-w-200 max-w-200 p-0 overflow-hidden z-[250]"
      >
        <div className="flex h-full">
          {/* Left Sidebar - Categories */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <SheetHeader className="p-4 pb-3 border-b">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <DynamicIcon
                  name="grid-3x3"
                  className="h-5 w-5 text-blue-600"
                />
                Applications
              </SheetTitle>
            </SheetHeader>

            <div className="p-3">
              <nav className="space-y-1">
                <NavItem
                  label="Favorites"
                  icon="star"
                  isActive={activeFilter === "favorites"}
                  count={favoriteApps.length}
                  onClick={() => setActiveFilter("favorites")}
                />
                <NavItem
                  label="All applications"
                  icon="grid-3x3"
                  isActive={activeFilter === "all-applications"}
                  count={applications.length}
                  onClick={() => setActiveFilter("all-applications")}
                />
                <NavItem
                  label="All services"
                  icon="server"
                  isActive={activeFilter === "all-services"}
                  count={applications.length}
                  onClick={() => setActiveFilter("all-services")}
                  type="divider-after"
                />

                {/* Categories */}
                {Object.entries(categoryStats).map(([category, count]) => (
                  <NavItem
                    key={category}
                    label={
                      APP_CATEGORY_LABELS[category as AppCategory] || category
                    }
                    icon="folder"
                    isActive={activeFilter === category}
                    count={count}
                    onClick={() => setActiveFilter(category as AppCategory)}
                  />
                ))}
              </nav>
            </div>
          </div>

          {/* Right Panel - Applications */}
          <div className="flex-1 flex flex-col min-width-300">
            {/* Search Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-8 text-gray-400" />
                <Input
                  placeholder="Search applications and services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </div>

            {/* Applications List */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Loading applications...
                    </p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <DynamicIcon
                        name="alert-triangle"
                        className="w-6 h-6 text-red-500"
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">
                        Unable to load applications
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {error}
                      </p>
                      <Button onClick={fetchApplications} size="sm">
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                      <Search className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="font-semibold mb-2">
                      No applications found
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {searchQuery || activeFilter !== "all-applications"
                        ? "Try adjusting your search or filters"
                        : "No applications are available"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredApplications.map((app: App) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        isFavorite={isFavorite(app.id)}
                        onToggleFavorite={toggleFavorite}
                        onAppClick={navigateToApp}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
