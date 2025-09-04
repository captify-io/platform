"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { DynamicIcon } from "lucide-react/dynamic";
import { Star, ChevronRight } from "lucide-react";
import { apiClient } from "../../lib/api";
import { useCaptify } from "../CaptifyProvider";
import type { App, UserState } from "../../types";

export function FavoritesBar() {
  const router = useRouter();
  const { session } = useCaptify();
  const [favoriteApps, setFavoriteApps] = useState<string[]>([]);
  const [availableApps, setAvailableApps] = useState<App[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

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

  // Fetch available apps from DynamoDB
  const fetchAvailableApps = useCallback(async () => {
    if (!session?.user) return;

    setAppsLoading(true);
    try {
      const response = await apiClient.run({
        service: "dynamo",
        operation: "scan",
        app: "core",
        table: "App",
        data: {
          FilterExpression: "#status = :status",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "active",
          },
        },
      });

      if (response.success && response.data?.Items) {
        setAvailableApps(response.data.Items as App[]);
      }
    } catch (error) {
      console.error("Error fetching available apps:", error);
    } finally {
      setAppsLoading(false);
    }
  }, [session?.user]);

  // Load data when session is available
  useEffect(() => {
    if (session?.user) {
      fetchAvailableApps();
      fetchFavoriteApps();
    }
  }, [session?.user, fetchAvailableApps, fetchFavoriteApps]);

  // Get favorite app objects from available apps
  const favoriteAppObjects = useMemo(() => {
    if (appsLoading || availableApps.length === 0) return [];

    return favoriteApps
      .map((appId: string) =>
        availableApps.find((app: App) => app.id === appId)
      )
      .filter((app): app is App => app !== undefined)
      .slice(0, 8); // Limit to 8 favorites for UI space
  }, [favoriteApps, availableApps, appsLoading]);

  // Don't render if loading
  if (appsLoading) {
    return (
      <div className="border-b border-border bg-background">
        <div className="max-w-full mx-auto px-4 py-2">
          <div className="text-sm text-muted-foreground">
            Loading favorites...
          </div>
        </div>
      </div>
    );
  }

  // Show debug info even when no favorites
  if (favoriteAppObjects.length === 0) {
    return (
      <div className="border-b border-border bg-background">
        <div className="max-w-full mx-auto px-4 py-2">
          <div className="text-sm text-muted-foreground">
            No favorites to display. Check console for debug info.
          </div>
        </div>
      </div>
    );
  }

  const handleAppClick = (app: App) => {
    // Navigate to the app using its slug
    router.push(`/${app.slug}`);
  };

  return (
    <div className="border-b border-border bg-background">
      <div className="max-w-full mx-auto px-4 py-2">
        <div className="flex items-center space-x-1">
          {/* Favorites Label */}
          <div className="flex items-center space-x-1 mr-3">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Favorites
            </span>
          </div>

          {/* Favorite Apps */}
          <div className="flex items-center space-x-1 overflow-x-auto">
            {favoriteAppObjects.map((app) => (
              <Button
                key={app.id}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 px-3 py-1.5 h-auto text-sm hover:bg-accent/50 transition-colors"
                onClick={() => handleAppClick(app)}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <DynamicIcon
                    name={(app as any).icon || "package"}
                    className="h-3.5 w-3.5 text-muted-foreground"
                  />
                </div>
                <span className="text-foreground">{app.name}</span>
              </Button>
            ))}

            {/* Show more indicator if there are more than 8 favorites */}
            {favoriteApps.length > 8 && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 px-2 py-1.5 h-auto text-sm text-muted-foreground hover:bg-accent/50"
                onClick={() => {
                  // Could open the application launcher here
                  console.log("Show more favorites");
                }}
              >
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-xs">+{favoriteApps.length - 8} more</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
