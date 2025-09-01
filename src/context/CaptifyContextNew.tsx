"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { Session } from "next-auth";
import { CaptifyClient } from "../lib/api/client";

// Simple user preferences interface
export interface UserPreferences {
  favoriteApps: string[];
  theme: string;
  language: string;
  timezone: string;
}

// Minimal context interface
export interface CaptifyContextType {
  // Authentication State (NextAuth)
  session: Session | null;
  isAuthenticated: boolean;

  // User Preferences (DynamoDB)
  userPreferences: UserPreferences | null;
  preferencesLoading: boolean;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;

  // Simple favorites management
  favoriteApps: string[];
  toggleFavorite: (appId: string) => Promise<void>;
}

const CaptifyContext = createContext<CaptifyContextType | undefined>(undefined);

interface CaptifyProviderProps {
  children: ReactNode;
}

export function CaptifyProvider({ children }: CaptifyProviderProps) {
  const { data: session, status } = useSession();

  // User preferences state
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Derived values
  const isAuthenticated = useMemo(() => !!session, [session]);
  const favoriteApps = useMemo(
    () => userPreferences?.favoriteApps || [],
    [userPreferences]
  );

  // Fetch user preferences from DynamoDB
  useEffect(() => {
    async function fetchUserPreferences() {
      if (!session?.user || !(session.user as any)?.id) {
        setUserPreferences(null);
        return;
      }

      setPreferencesLoading(true);
      try {
        const client = new CaptifyClient({
          appId: "core",
          session: session,
        });

        const userId = (session.user as any).id;

        // Query user preferences
        const response = await client.query({
          table: "captify-core-UserState",
          indexName: "userId-index",
          keyConditionExpression: "userId = :userId",
          expressionAttributeValues: {
            ":userId": userId,
          },
          limit: 1,
        });

        if (response.success && response.data?.Items?.length > 0) {
          const userState = response.data.Items[0] as any;
          setUserPreferences({
            favoriteApps: userState.favoriteApps || [],
            theme: userState.theme || "auto",
            language: userState.language || "en",
            timezone: userState.timezone || "UTC",
          });
        } else {
          // Default preferences
          setUserPreferences({
            favoriteApps: [],
            theme: "auto",
            language: "en",
            timezone: "UTC",
          });
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
        setUserPreferences({
          favoriteApps: [],
          theme: "auto",
          language: "en",
          timezone: "UTC",
        });
      } finally {
        setPreferencesLoading(false);
      }
    }

    if (session) {
      fetchUserPreferences();
    }
  }, [session]);

  // Update user preferences
  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      if (!session?.user || !(session.user as any)?.id || !userPreferences)
        return;

      const newPreferences = { ...userPreferences, ...updates };
      setUserPreferences(newPreferences);

      try {
        const client = new CaptifyClient({
          appId: "core",
          session: session,
        });

        const userId = (session.user as any).id;

        // Find or create user state
        const userStatesResponse = await client.query({
          table: "captify-core-UserState",
          indexName: "userId-index",
          keyConditionExpression: "userId = :userId",
          expressionAttributeValues: {
            ":userId": userId,
          },
          limit: 1,
        });

        let userStateId: string;

        if (
          userStatesResponse.success &&
          userStatesResponse.data?.Items?.length > 0
        ) {
          const userState = userStatesResponse.data.Items[0] as any;
          userStateId = userState.userStateId;

          // Update existing
          await client.update({
            table: "captify-core-UserState",
            key: { userStateId },
            updateExpression:
              "SET favoriteApps = :favoriteApps, theme = :theme, language = :language, timezone = :timezone, updatedAt = :updatedAt",
            expressionAttributeValues: {
              ":favoriteApps": newPreferences.favoriteApps,
              ":theme": newPreferences.theme,
              ":language": newPreferences.language,
              ":timezone": newPreferences.timezone,
              ":updatedAt": new Date(),
            },
          });
        } else {
          // Create new
          const newUserState = {
            userStateId: globalThis.crypto.randomUUID(),
            userId: userId,
            favoriteApps: newPreferences.favoriteApps,
            theme: newPreferences.theme,
            language: newPreferences.language,
            timezone: newPreferences.timezone,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await client.put({
            table: "captify-core-UserState",
            data: newUserState,
          });
        }
      } catch (error) {
        console.error("Error updating preferences:", error);
        // Revert on error
        setUserPreferences(userPreferences);
      }
    },
    [session, userPreferences]
  );

  // Toggle favorite app
  const toggleFavorite = useCallback(
    async (appId: string) => {
      if (!userPreferences) return;

      const currentFavorites = userPreferences.favoriteApps;
      const newFavorites = currentFavorites.includes(appId)
        ? currentFavorites.filter((id) => id !== appId)
        : [...currentFavorites, appId];

      await updatePreferences({ favoriteApps: newFavorites });
    },
    [userPreferences, updatePreferences]
  );

  // Context value
  const contextValue: CaptifyContextType = useMemo(
    () => ({
      session,
      isAuthenticated,
      userPreferences,
      preferencesLoading,
      updatePreferences,
      favoriteApps,
      toggleFavorite,
    }),
    [
      session,
      isAuthenticated,
      userPreferences,
      preferencesLoading,
      updatePreferences,
      favoriteApps,
      toggleFavorite,
    ]
  );

  return (
    <SessionProvider>
      <CaptifyContext.Provider value={contextValue}>
        {children}
      </CaptifyContext.Provider>
    </SessionProvider>
  );
}

export function useCaptify(): CaptifyContextType {
  const context = useContext(CaptifyContext);
  if (context === undefined) {
    throw new Error("useCaptify must be used within a CaptifyProvider");
  }
  return context;
}
