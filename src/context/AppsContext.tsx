"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ApplicationEntity, UserApplicationState } from "@/types/database";
import { applicationApiService } from "@/lib/services/application-api";
import { useSession } from "next-auth/react";

export interface AppDefinition {
  alias: string;
  name: string;
  agentId: string;
}

interface AppsContextValue {
  applications: ApplicationEntity[];
  userStates: Record<string, UserApplicationState>;
  loading: boolean;
  error: string | null;
  favoriteApps: string[];
  toggleFavorite: (appId: string) => void;
  recentApps: string[];
  markAsRecent: (appId: string) => void;
  refreshApplications: () => Promise<void>;
}

const AppsContext = createContext<AppsContextValue | undefined>(undefined);

export function AppsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<ApplicationEntity[]>([]);
  const [userStates, setUserStates] = useState<
    Record<string, UserApplicationState>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    // Check for user session with proper user ID (UUID) or fallback to email
    const userId = session?.user?.email;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await applicationApiService.getApplicationsWithUserStates(
        {}
      );

      setApplications(result.applications);

      // Convert user states array to record for easier access
      const statesRecord = result.userStates.reduce(
        (
          acc: Record<string, UserApplicationState>,
          state: UserApplicationState
        ) => {
          acc[state.app_id] = state;
          return acc;
        },
        {} as Record<string, UserApplicationState>
      );
      setUserStates(statesRecord);
    } catch (err) {
      console.error("Database Error [LIST_APPLICATIONS_FAILED]:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load applications"
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Load applications when session changes
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Get favorite apps from user states
  const favoriteApps = Object.entries(userStates)
    .filter(([, state]) => state.favorite)
    .map(([appId]) => appId);

  // Get recent apps sorted by last access
  const recentApps = Object.entries(userStates)
    .filter(([, state]) => state.last_accessed)
    .sort(
      (a, b) =>
        new Date(b[1].last_accessed!).getTime() -
        new Date(a[1].last_accessed!).getTime()
    )
    .slice(0, 10)
    .map(([appId]) => appId);

  const toggleFavorite = async (appId: string) => {
    // Check for user session with proper user ID (UUID) or fallback to email
    const userId = session?.user?.email;
    if (!userId) {
      console.warn("❌ No user session found for toggleFavorite");
      return;
    }

    try {
      const currentState = userStates[appId];
      const isFavorite = currentState?.favorite || false;

      console.log("🔄 toggleFavorite called:", { appId, isFavorite, userId });

      if (isFavorite) {
        // Remove from favorites
        const response = await fetch("/api/apps/favorites", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": userId,
          },
          body: JSON.stringify({ app_id: appId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to remove favorite: ${response.status}`);
        }

        console.log("✅ Removed favorite successfully");
      } else {
        // Add to favorites
        const response = await fetch("/api/apps/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": userId,
          },
          body: JSON.stringify({ app_id: appId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to add favorite: ${response.status}`);
        }

        console.log("✅ Added favorite successfully");
      }

      // Update local state optimistically
      const updatedState = {
        ...currentState,
        app_id: appId,
        user_id: userId,
        favorite: !isFavorite,
        updated_at: new Date().toISOString(),
      } as UserApplicationState;

      setUserStates((prev) => ({
        ...prev,
        [appId]: updatedState,
      }));
    } catch (err) {
      console.error("💥 Failed to toggle favorite:", err);
    }
  };

  const markAsRecent = useCallback(
    async (appId: string) => {
      // Check for user session with proper user ID (UUID) or fallback to email
      const userId = session?.user?.email;
      if (!userId) return;

      try {
        await applicationApiService.trackAccess(appId);

        // Update local state optimistically using functional update
        setUserStates((prev) => {
          const currentState = prev[appId];
          const updatedState = {
            ...currentState,
            app_id: appId,
            user_id: userId,
            last_accessed: new Date().toISOString(),
            access_count: (currentState?.access_count || 0) + 1,
            favorite: currentState?.favorite || false,
            saved_tools: currentState?.saved_tools || [],
            session_state: currentState?.session_state || {},
            created_at: currentState?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as UserApplicationState;

          return {
            ...prev,
            [appId]: updatedState,
          };
        });
      } catch (err) {
        console.error("Failed to mark as recent:", err);
      }
    },
    [session?.user?.email]
  ); // Only depend on session email

  return (
    <AppsContext.Provider
      value={{
        applications,
        userStates,
        loading,
        error,
        favoriteApps,
        toggleFavorite,
        recentApps,
        markAsRecent,
        refreshApplications: loadApplications,
      }}
    >
      {children}
    </AppsContext.Provider>
  );
}

export function useApps() {
  const context = useContext(AppsContext);
  if (!context) {
    throw new Error("useApps must be used within an AppsProvider");
  }
  return context;
}
