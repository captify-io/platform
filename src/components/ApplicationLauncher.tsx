"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCaptify } from "../context/CaptifyContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { apiClient } from "@/lib/api/client";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { App } from "@captify/core";
import { APP_CATEGORY_LABELS } from "../types";
import { DynamicIcon } from "./ui/dynamic-icon";
import { useDebug } from "@/hooks";
import { Search, Grid3X3, Star, Package } from "lucide-react";

interface ApplicationLauncherProps {
  className?: string;
}

// Professional App Card Component
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
  const isDebugMode = useDebug();

  // Debug logging for each app (only when debug mode is enabled)
  if (isDebugMode) {
    console.log("🔍 AppCard Debug for app:", app.name || "Unknown");
    console.log("  App object:", app);
    console.log("  App properties:", Object.keys(app));
    console.log("  App.name:", app.name);
    console.log("  App.description:", (app as any).description);
    console.log("  App.category:", (app as any).category);
  }

  return (
    <div
      className="group relative flex items-center space-x-4 p-4 hover:bg-accent/50 cursor-pointer transition-all duration-200 rounded-lg border border-transparent hover:border-border/50"
      onClick={() => onAppClick(app)}
    >
      {/* App Icon */}
      <div className="relative">
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-border group-hover:border-blue-500/30 transition-all duration-200">
          <DynamicIcon
            name={(app as any).icon || "package"}
            className="h-7 w-7 text-blue-600 group-hover:text-blue-700 transition-colors"
          />
        </div>
        {isFavorite && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {app.name}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {(app as any).description ||
                "Application description not available"}
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="secondary" className="text-xs">
                {APP_CATEGORY_LABELS[
                  (app as any).category as keyof typeof APP_CATEGORY_LABELS
                ] ||
                  (app as any).category?.charAt(0).toUpperCase() +
                    (app as any).category?.slice(1) ||
                  "Other"}
              </Badge>
            </div>
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onToggleFavorite(app.id);
            }}
            className={`ml-2 h-10 w-10 p-0 transition-all duration-200 self-start ${
              isFavorite
                ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            }`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={`h-5 w-5 ${
                isFavorite ? "fill-current" : ""
              } transition-all duration-200`}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ApplicationLauncher({ className }: ApplicationLauncherProps) {
  const isDebugMode = useDebug();
  const [isOpen, setIsOpen] = useState(false);
  const [applications, setApplications] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { session, favoriteApps, toggleFavorite } = useCaptify();
  const { navigateToApp } = useAppNavigation();
  const router = useRouter();

  // Extract unique categories from applications with counts
  const categoryStats = applications.reduce(
    (acc: Record<string, number>, app: App) => {
      const category = (app as any).category || "other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const categories = Object.keys(categoryStats);

  // Filter applications based on selected categories and search
  const filteredApplications = applications.filter((app: App) => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes((app as any).category || "other");

    const matchesSearch =
      searchQuery === "" ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((app as any).description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Separate favorites and regular apps
  const favoriteAppsFiltered = filteredApplications.filter((app) =>
    favoriteApps.includes(app.id)
  );
  const regularAppsFiltered = filteredApplications.filter(
    (app) => !favoriteApps.includes(app.id)
  );

  if (isDebugMode) {
    console.log("🔍 ApplicationLauncher Stats:");
    console.log("  Total applications:", applications.length);
    console.log("  Filtered applications:", filteredApplications.length);
    console.log("  Categories:", categories);
    console.log("  Selected categories:", selectedCategories);
    console.log("  Search query:", searchQuery);
  }

  const fetchApps = useCallback(async () => {
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
          limit: 50,
        },
      });

      if (!response.success) {
        setError(response.error || "Failed to fetch applications");
        return;
      }

      const apps = response.data?.Items || [];

      if (isDebugMode) {
        console.log("🔍 ApplicationLauncher Debug:");
        console.log("  Raw response:", response);
        console.log("  Response data:", response.data);
        console.log("  DynamoDB Items:", apps);
        console.log("  Items length:", apps.length);
        console.log("  First item:", apps[0]);
      }

      setApplications(apps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [session, isDebugMode]);

  // Fetch when opened and clear when closed
  useEffect(() => {
    if (isOpen) {
      fetchApps();
    } else {
      // Clear search and selections when menu closes
      setSearchQuery("");
      setSelectedCategories([]);
    }
  }, [isOpen, fetchApps]);

  const handleToggleFavorite = async (appId: string) => {
    await toggleFavorite(appId);
  };

  const handleAppClick = (app: App) => {
    navigateToApp(app);
    setIsOpen(false);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

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
        className="w-[400px] sm:w-[500px] p-0 overflow-hidden"
      >
        {/* Use a fragment and move all content into a separate component or prop if required by your UI library */}
        <>
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-blue-500/5 to-purple-600/10">
              <SheetTitle className="flex items-center gap-2 text-xl">
                <DynamicIcon name="package" className="h-6 w-6 text-blue-600" />
                Applications
              </SheetTitle>
              <SheetDescription>
                Launch any application from your workspace
              </SheetDescription>
            </SheetHeader>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <DynamicIcon
                  name="search"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500"
                />
                <Input
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories Filter */}
            {applications.length > 0 && (
              <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      selectedCategories.length === 0 ? "default" : "outline"
                    }
                    className="cursor-pointer transition-all hover:bg-blue-600 hover:text-white bg-blue-500 text-white border-blue-500"
                    onClick={() => setSelectedCategories([])}
                  >
                    All ({applications.length})
                  </Badge>
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={
                        selectedCategories.includes(category)
                          ? "default"
                          : "outline"
                      }
                      className={`cursor-pointer transition-all ${
                        selectedCategories.includes(category)
                          ? "hover:bg-blue-600 bg-blue-500 text-white border-blue-500"
                          : "hover:bg-blue-500 hover:text-white hover:border-blue-500"
                      }`}
                      onClick={() => toggleCategory(category)}
                    >
                      {APP_CATEGORY_LABELS[
                        category as keyof typeof APP_CATEGORY_LABELS
                      ] ||
                        category.charAt(0).toUpperCase() +
                          category.slice(1)}{" "}
                      ({categoryStats[category]})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Applications List */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
                    <p className="text-muted-foreground font-medium">
                      Loading applications...
                    </p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
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
                      <p className="text-sm text-muted-foreground mb-4">
                        {error.includes("not authorized") ||
                        error.includes("permission")
                          ? "You don't have permission to view applications."
                          : "There was an error loading applications."}
                      </p>
                      <Button onClick={fetchApps} size="sm">
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <DynamicIcon
                        name="search"
                        className="w-6 h-6 text-blue-500"
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">
                        No applications found
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery || selectedCategories.length > 0
                          ? "Try adjusting your search or filters"
                          : "No applications are available"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Favorites Section */}
                    {favoriteAppsFiltered.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <DynamicIcon
                            name="star"
                            className="h-4 w-4 text-yellow-500 fill-yellow-500"
                          />
                          <h4 className="font-semibold text-sm text-foreground">
                            Favorites
                          </h4>
                        </div>
                        <div className="space-y-1">
                          {favoriteAppsFiltered.map((app: App) => (
                            <AppCard
                              key={app.id || app.slug || `fav-${app.name}`}
                              app={app}
                              isFavorite={true}
                              onToggleFavorite={handleToggleFavorite}
                              onAppClick={handleAppClick}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Regular Apps Section */}
                    {regularAppsFiltered.length > 0 && (
                      <div>
                        {favoriteAppsFiltered.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <DynamicIcon
                              name="package"
                              className="h-4 w-4 text-blue-500"
                            />
                            <h4 className="font-semibold text-sm text-foreground">
                              All Applications
                            </h4>
                          </div>
                        )}
                        <div className="space-y-1">
                          {regularAppsFiltered.map((app: App) => (
                            <AppCard
                              key={app.id || app.slug || `reg-${app.name}`}
                              app={app}
                              isFavorite={false}
                              onToggleFavorite={handleToggleFavorite}
                              onAppClick={handleAppClick}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      </SheetContent>
    </Sheet>
  );
}
