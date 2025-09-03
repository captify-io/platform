"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "../lib";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { DynamicIcon } from "lucide-react/dynamic";
import { App, UserState } from "../types";
import { APP_CATEGORY_LABELS } from "../types/app";
import { useDebug } from "../hooks";
import { Grid3X3, Star } from "lucide-react";
import type { Session } from "next-auth";

interface ApplicationLauncherProps {
  className?: string;
  session: Session | null;
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
  const searchParams = useSearchParams();
  const isDebugMode = useDebug(searchParams);

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
      className="group relative flex items-center space-x-2 p-1.5 hover:bg-accent/50 cursor-pointer transition-all duration-200 rounded-md border border-transparent hover:border-border/50"
      onClick={() => onAppClick(app)}
    >
      {/* App Icon */}
      <div className="relative">
        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-border group-hover:border-blue-500/30 transition-all duration-200">
          <DynamicIcon
            name={(app as any).icon || "package"}
            className="h-4 w-4 text-blue-600 group-hover:text-blue-700 transition-colors"
          />
        </div>
        {isFavorite && (
          <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-xs text-foreground group-hover:text-primary transition-colors truncate">
              {app.name}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0">
              {(app as any).description ||
                "Application description not available"}
            </p>
            <div className="flex items-center mt-0.5">
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
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
            className={`ml-1 h-6 w-6 p-0 transition-all duration-200 self-start ${
              isFavorite
                ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            }`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={`h-3 w-3 ${
                isFavorite ? "fill-current" : ""
              } transition-all duration-200`}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ApplicationLauncher({
  className,
  session,
}: ApplicationLauncherProps) {
  const searchParams = useSearchParams();
  const isDebugMode = useDebug(searchParams);
  const [isOpen, setIsOpen] = useState(false);
  const [applications, setApplications] = useState<App[]>([]);
  const [favoriteApps, setFavoriteApps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();

  // Fetch user's favorite apps from DynamoDB
  const fetchFavoriteApps = useCallback(async () => {
    if (!session?.user || !(session.user as any)?.id) return;

    try {
      const userId = (session.user as any).id;
      const response = await apiClient.run({
        service: "dynamo",
        operation: "query",
        app: "core",
        table: "UserState",
        data: {
          IndexName: "userId-index",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId,
          },
          Limit: 1,
        },
      });

      if (response.success && response.data?.Items?.length > 0) {
        const userState = response.data.Items[0] as UserState;
        setFavoriteApps(userState.favorites?.applications || []);
      }
    } catch (error) {
      console.error("Error fetching favorite apps:", error);
    }
  }, [session?.user]);

  // Toggle favorite app
  const toggleFavorite = useCallback(
    async (appId: string) => {
      if (!session?.user || !(session.user as any)?.id) return;

      const newFavorites = favoriteApps.includes(appId)
        ? favoriteApps.filter((id) => id !== appId)
        : [...favoriteApps, appId];

      setFavoriteApps(newFavorites);

      try {
        const userId = (session.user as any).id;

        // Get current user state
        const userStatesResponse = await apiClient.run({
          service: "dynamo",
          operation: "query",
          app: "core",
          table: "UserState",
          data: {
            IndexName: "userId-index",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
              ":userId": userId,
            },
            Limit: 1,
          },
        });

        if (
          userStatesResponse.success &&
          userStatesResponse.data?.Items?.length > 0
        ) {
          const userState = userStatesResponse.data.Items[0] as UserState;

          // Update favorites
          await apiClient.run({
            service: "dynamo",
            operation: "update",
            app: "core",
            table: "UserState",
            data: {
              key: { id: userState.id },
              updateExpression: "SET #favorites.#applications = :favorites",
              expressionAttributeNames: {
                "#favorites": "favorites",
                "#applications": "applications",
              },
              expressionAttributeValues: {
                ":favorites": newFavorites,
              },
            },
          });
        }
      } catch (error) {
        console.error("Error updating favorite apps:", error);
        // Revert on error
        setFavoriteApps(favoriteApps);
      }
    },
    [session?.user, favoriteApps]
  );

  // Create local navigation function
  const navigateToApp = useCallback(
    (app: App) => {
      // Navigate to the app's route
      const appRoute = `/${app.slug}`;
      router.push(appRoute);
    },
    [router]
  );

  // Ensure component only renders on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load favorite apps when session is available
  useEffect(() => {
    if (session?.user) {
      fetchFavoriteApps();
    }
  }, [session?.user, fetchFavoriteApps]);

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

  // Render loading state while mounting to prevent SSR issues
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
        className="w-[400px] sm:w-[500px] p-0 overflow-hidden z-[250]"
      >
        {/* Use a fragment and move all content into a separate component or prop if required by your UI library */}
        <>
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-4 pb-3 border-b bg-gradient-to-r from-blue-500/5 to-purple-600/10">
              <SheetTitle className="flex items-center gap-2 text-xl">
                <DynamicIcon name="package" className="h-6 w-6 text-blue-600" />
                Applications
              </SheetTitle>

              {/* Search moved under Applications */}
              <div className="relative mt-3">
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
            </SheetHeader>

            {/* Categories Filter - moved up since search is now in header */}
            {applications.length > 0 && (
              <div className="p-3 border-b bg-slate-50 dark:bg-slate-900/50">
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
              <div className="p-2">
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
                  <div className="space-y-3">
                    {/* Favorites Section */}
                    {favoriteAppsFiltered.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <DynamicIcon
                            name="star"
                            className="h-4 w-4 text-yellow-500 fill-yellow-500"
                          />
                          <h4 className="font-medium text-sm text-foreground">
                            Favorites
                          </h4>
                        </div>
                        <div className="space-y-0.5">
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
                          <div className="flex items-center gap-2 mb-2">
                            <DynamicIcon
                              name="package"
                              className="h-4 w-4 text-blue-500"
                            />
                            <h4 className="font-medium text-sm text-foreground">
                              All Applications
                            </h4>
                          </div>
                        )}
                        <div className="space-y-0.5">
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
