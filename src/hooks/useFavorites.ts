"use client";

import { useCallback, useEffect } from "react";
import { useState } from "../lib/react-compat";
import { apiClient } from "../lib/api";
import { useCaptify } from "../components/providers/CaptifyProvider";
// UserState is a core-specific type
type UserState = any;

/**
 * Hook for managing user favorites
 * Provides real-time updates when favorites are added/removed
 */
export function useFavorites() {
  const { session } = useCaptify();
  const [favoriteApps, setFavoriteApps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's favorite apps from DynamoDB
  const fetchFavoriteApps = useCallback(async () => {
    if (!session?.user || !(session.user as any)?.id) {
      setFavoriteApps([]);
      return;
    }

    setLoading(true);
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
        // UserState has favoriteApps as a direct array property
        setFavoriteApps(userState.favoriteApps || []);
      } else {
        setFavoriteApps([]);
      }
    } catch (error) {
      console.error("Error fetching favorite apps:", error);
      setFavoriteApps([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // Toggle favorite app
  const toggleFavorite = useCallback(
    async (appId: string): Promise<void> => {
      if (!session?.user || !(session.user as any)?.id) return;

      const newFavorites = favoriteApps.includes(appId)
        ? favoriteApps.filter((id) => id !== appId)
        : [...favoriteApps, appId];

      // Update local state immediately for better UX
      setFavoriteApps(newFavorites);

      try {
        const userId = (session.user as any).id;
        
        // First, get the current UserState
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
          // Update existing UserState
          const userState = userStatesResponse.data.Items[0] as UserState;
          await apiClient.run({
            service: "dynamo",
            operation: "update",
            app: "core",
            table: "UserState",
            data: {
              key: { id: userState.id },
              updateExpression: "SET favoriteApps = :favorites, updatedAt = :updatedAt",
              expressionAttributeValues: {
                ":favorites": newFavorites,
                ":updatedAt": new Date().toISOString(),
              },
            },
          });
        } else {
          // Create new UserState if none exists (matching Core interface)
          const newUserState = {
            id: `userstate-${userId}-${Date.now()}`,
            slug: `userstate-${userId}`,
            name: `UserState for ${(session.user as any).email || userId}`,
            app: "core",
            order: "0",
            fields: {},
            description: "User preferences and state",
            ownerId: userId,
            createdAt: new Date().toISOString(),
            createdBy: userId,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
            userId: userId,
            favoriteApps: newFavorites,
            recentApps: [],
            preferences: {},
          };

          await apiClient.run({
            service: "dynamo",
            operation: "put",
            app: "core",
            table: "UserState",
            data: {
              item: newUserState,
            },
          });
        }
      } catch (error) {
        console.error("Error updating favorite apps:", error);
        // Revert local state on error
        setFavoriteApps(favoriteApps);
      }
    },
    [session?.user, favoriteApps]
  );

  // Load favorites when session changes
  useEffect(() => {
    fetchFavoriteApps();
  }, [fetchFavoriteApps]);

  // Check if an app is favorited
  const isFavorite = useCallback(
    (appId: string): boolean => {
      return favoriteApps.includes(appId);
    },
    [favoriteApps]
  );

  return {
    favoriteApps,
    loading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavoriteApps,
  };
}