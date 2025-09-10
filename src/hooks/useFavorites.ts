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
      console.log('[useFavorites] No session or user ID, clearing favorites');
      setFavoriteApps([]);
      return;
    }

    setLoading(true);
    try {
      const userId = (session.user as any).id;
      console.log('[useFavorites] Fetching favorites for user:', userId);
      
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

      console.log('[useFavorites] UserState query response:', response);

      if (response.success && response.data?.Items?.length > 0) {
        const userState = response.data.Items[0] as UserState;
        console.log('[useFavorites] Found UserState:', userState);
        console.log('[useFavorites] Favorite apps:', userState.favoriteApps);
        // UserState has favoriteApps as a direct array property
        setFavoriteApps(userState.favoriteApps || []);
      } else {
        console.log('[useFavorites] No UserState found, setting empty favorites');
        setFavoriteApps([]);
      }
    } catch (error) {
      console.error("[useFavorites] Error fetching favorite apps:", error);
      setFavoriteApps([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // Toggle favorite app
  const toggleFavorite = useCallback(
    async (appId: string): Promise<void> => {
      if (!session?.user || !(session.user as any)?.id) {
        console.log('[useFavorites] No session for toggleFavorite');
        return;
      }

      const newFavorites = favoriteApps.includes(appId)
        ? favoriteApps.filter((id) => id !== appId)
        : [...favoriteApps, appId];

      console.log('[useFavorites] Toggling favorite:', appId);
      console.log('[useFavorites] Current favorites:', favoriteApps);
      console.log('[useFavorites] New favorites:', newFavorites);

      // Update local state immediately for better UX
      setFavoriteApps(newFavorites);

      try {
        const userId = (session.user as any).id;
        
        console.log('[useFavorites] Saving favorites for user:', userId);
        
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

        console.log('[useFavorites] UserState lookup response:', userStatesResponse);

        if (
          userStatesResponse.success &&
          userStatesResponse.data?.Items?.length > 0
        ) {
          // Update existing UserState
          const userState = userStatesResponse.data.Items[0] as UserState;
          console.log('[useFavorites] Updating existing UserState:', userState.id);
          
          const updateResponse = await apiClient.run({
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
          
          console.log('[useFavorites] Update response:', updateResponse);
        } else {
          // Create new UserState if none exists (matching Core interface)
          console.log('[useFavorites] Creating new UserState for user:', userId);
          
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

          const createResponse = await apiClient.run({
            service: "dynamo",
            operation: "put",
            app: "core",
            table: "UserState",
            data: {
              item: newUserState,
            },
          });
          
          console.log('[useFavorites] Create UserState response:', createResponse);
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