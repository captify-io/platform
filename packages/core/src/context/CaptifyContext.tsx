"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import { apiClient } from "../lib";
import { App, UserState } from "../types";

// Simple user preferences interface (subset of UserState for UI)
export interface UserPreferences {
  favoriteApps: string[];
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
}

// App context for routing and AWS configuration
export interface AppContextType {
  currentApp?: App;
  availableApps: App[];
  appsLoading: boolean;
}

// Minimal context interface
export interface CaptifyContextType {
  // Authentication State (NextAuth)
  session: Session | null;
  sessionStatus: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;

  // User Preferences (DynamoDB)
  userPreferences: UserPreferences | null;
  preferencesLoading: boolean;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;

  // Simple favorites management
  favoriteApps: string[];
  toggleFavorite: (appId: string) => Promise<void>;

  // App Management
  appContext: AppContextType;
  setCurrentApp: (app: App) => void;
  getCurrentAppConfig: () => App | undefined;

  // Agent panel controls (for ThreePanelLayout compatibility)
  toggleAgentPanel: () => void;
  setAgentWidth: (width: number) => void;
}

const CaptifyContext = createContext<CaptifyContextType | undefined>(undefined);

interface CaptifyProviderProps {
  children: ReactNode;
  initialPackage?: string;
}

export function CaptifyProvider({
  children,
  initialPackage,
}: CaptifyProviderProps) {
  return (
    <CaptifyProviderInner initialPackage={initialPackage}>
      {children}
    </CaptifyProviderInner>
  );
}

// Internal provider that uses useSession
function CaptifyProviderInner({
  children,
  initialPackage,
}: CaptifyProviderProps) {
  const { data: session, status } = useSession();

  // User preferences state
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // App context state
  const [currentApp, setCurrentApp] = useState<App | undefined>(undefined);
  const [availableApps, setAvailableApps] = useState<App[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsLoaded, setAppsLoaded] = useState(false);

  // Agent panel state (simplified for ThreePanelLayout compatibility)
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [agentWidth, setAgentWidth] = useState(320);

  // Reset loaded flags when user changes
  useEffect(() => {
    setPreferencesLoaded(false);
    setAppsLoaded(false);
  }, [(session?.user as any)?.id]);

  // Derived values
  const isAuthenticated = useMemo(() => !!session, [session]);
  const favoriteApps = useMemo(
    () => userPreferences?.favoriteApps || [],
    [userPreferences]
  );

  // App context object
  const appContext = useMemo(
    (): AppContextType => ({
      currentApp,
      availableApps,
      appsLoading,
    }),
    [currentApp, availableApps, appsLoading]
  );

  // Get current app config function
  const getCurrentAppConfig = useCallback(() => currentApp, [currentApp]);

  // Fetch user preferences from DynamoDB
  useEffect(() => {
    async function fetchUserPreferences() {
      if (!session?.user || !(session.user as any)?.id) {
        setUserPreferences(null);
        setPreferencesLoaded(false);
        return;
      }

      // Prevent multiple calls for the same user
      if (preferencesLoaded || preferencesLoading) {
        return;
      }

      console.log("🔄 Loading user preferences...");
      setPreferencesLoading(true);
      try {
        const userId = (session.user as any).id;

        // Query user preferences
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
          setUserPreferences({
            favoriteApps: userState.favorites?.applications || [],
            theme: userState.preferences?.theme || "auto",
            language: userState.preferences?.language || "en",
            timezone: userState.preferences?.timezone || "UTC",
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
        setPreferencesLoaded(true);
        console.log("✅ User preferences loaded successfully");
      } catch (error) {
        console.error("❌ Error fetching user preferences:", error);
        setUserPreferences({
          favoriteApps: [],
          theme: "auto",
          language: "en",
          timezone: "UTC",
        });
        setPreferencesLoaded(true); // Mark as loaded even on error to prevent retries
      } finally {
        setPreferencesLoading(false);
      }
    }

    if (session) {
      fetchUserPreferences();
    }
  }, [(session?.user as any)?.id, preferencesLoaded, preferencesLoading]); // More specific dependencies

  // Update user preferences
  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      if (!session?.user || !(session.user as any)?.id || !userPreferences)
        return;

      const newPreferences = { ...userPreferences, ...updates };
      setUserPreferences(newPreferences);

      try {
        const userId = (session.user as any).id;

        // Find or create user state
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

        let userStateId: string;

        if (
          userStatesResponse.success &&
          userStatesResponse.data?.Items?.length > 0
        ) {
          const userState = userStatesResponse.data.Items[0] as UserState;
          userStateId = userState.id;

          // Update existing with proper UserState structure
          await apiClient.run({
            service: "dynamo",
            operation: "update",
            app: "core",
            table: "UserState",
            data: {
              key: { id: userStateId },
              updateExpression:
                "SET #favorites = :favorites, #preferences = :preferences, #updatedAt = :updatedAt, #updatedBy = :updatedBy",
              expressionAttributeNames: {
                "#favorites": "favorites",
                "#preferences": "preferences",
                "#updatedAt": "updatedAt",
                "#updatedBy": "updatedBy",
              },
              expressionAttributeValues: {
                ":favorites": {
                  applications: newPreferences.favoriteApps,
                  pages: userState.favorites?.pages || [],
                  searches: userState.favorites?.searches || [],
                  reports: userState.favorites?.reports || [],
                },
                ":preferences": {
                  theme: newPreferences.theme,
                  language: newPreferences.language,
                  timezone: newPreferences.timezone,
                  notifications: userState.preferences?.notifications || {
                    email: true,
                    inApp: true,
                    security: true,
                    marketing: false,
                  },
                  dashboard: userState.preferences?.dashboard || {
                    layout: "grid",
                    widgets: [],
                    defaultView: "home",
                  },
                  accessibility: userState.preferences?.accessibility || {
                    highContrast: false,
                    fontSize: "medium",
                    reduceMotion: false,
                  },
                },
                ":updatedAt": new Date().toISOString(),
                ":updatedBy": userId,
              },
            },
          });
        } else {
          // Create new UserState with proper structure
          const newUserState: Partial<UserState> = {
            id: globalThis.crypto.randomUUID(),
            slug: `user-state-${userId}`,
            name: `User State for ${userId}`,
            app: "core",
            fields: {},
            description: "User preferences and state",
            ownerId: userId,
            userId: userId,
            orgId: (session.user as any)?.orgId || "default",
            preferences: {
              theme: newPreferences.theme,
              language: newPreferences.language,
              timezone: newPreferences.timezone,
              notifications: {
                email: true,
                inApp: true,
                security: true,
                marketing: false,
              },
              dashboard: {
                layout: "grid",
                widgets: [],
                defaultView: "home",
              },
              accessibility: {
                highContrast: false,
                fontSize: "medium",
                reduceMotion: false,
              },
            },
            favorites: {
              applications: newPreferences.favoriteApps,
              pages: [],
              searches: [],
              reports: [],
            },
            recentActivity: {
              applications: [],
              pages: [],
            },
            customSettings: {},
            lastSyncAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            createdBy: userId,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
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

  // Agent panel control functions (simplified for ThreePanelLayout compatibility)
  const toggleAgentPanel = useCallback(() => {
    setAgentPanelOpen(!agentPanelOpen);
  }, [agentPanelOpen]);

  const setAgentWidthCallback = useCallback((width: number) => {
    setAgentWidth(width);
  }, []);

  // Context value - split into smaller memoized chunks to reduce re-renders
  const sessionData = useMemo(
    () => ({
      session,
      sessionStatus: status,
      isAuthenticated,
    }),
    [session, status, isAuthenticated]
  );

  const userData = useMemo(
    () => ({
      userPreferences,
      preferencesLoading,
      favoriteApps,
    }),
    [userPreferences, preferencesLoading, favoriteApps]
  );

  // Memoize functions to prevent re-renders
  const actions = useMemo(
    () => ({
      updatePreferences,
      toggleFavorite,
      setCurrentApp,
      getCurrentAppConfig,
      toggleAgentPanel,
      setAgentWidth: setAgentWidthCallback,
    }),
    [
      updatePreferences,
      toggleFavorite,
      setCurrentApp,
      getCurrentAppConfig,
      toggleAgentPanel,
      setAgentWidthCallback,
    ]
  );

  const contextValue: CaptifyContextType = useMemo(
    () => ({
      ...sessionData,
      ...userData,
      appContext,
      ...actions,
    }),
    [sessionData, userData, appContext, actions]
  );

  return (
    <CaptifyContext.Provider value={contextValue}>
      {children}
    </CaptifyContext.Provider>
  );
}

export function useCaptify(): CaptifyContextType {
  const context = useContext(CaptifyContext);
  if (!context) {
    throw new Error("useCaptify must be used within a CaptifyProvider");
  }
  return context;
}

// Auth component - only renders children when user is authenticated
export function Auth({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Don't render anything if not authenticated
  }

  return <>{children}</>;
}

// UnAuth component - only renders children when user is NOT authenticated
export function UnAuth({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null; // Don't render during loading
  }

  if (session) {
    return null; // Don't render if authenticated
  }

  return <>{children}</>;
}
