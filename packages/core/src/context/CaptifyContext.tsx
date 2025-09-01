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
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { apiClient } from "../lib";
import { App, UserState, PackageConfig, PackageMenuItem } from "../types";

// Simple user preferences interface (subset of UserState for UI)
export interface UserPreferences {
  favoriteApps: string[];
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
}

// Package state interface
export interface PackageState {
  currentPackage: string;
  currentRoute: string;
  agentPanelOpen: boolean;
  agentWidth: number;
}

// Chat message interface
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
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

  // Package functionality (from PackageContext)
  packageConfig: PackageConfig | null;
  packageLoading: boolean;
  packageState: PackageState;
  setCurrentRoute: (route: string) => void;
  toggleAgentPanel: () => void;
  setAgentWidth: (width: number) => void;
  chatHistory: ChatMessage[];
  sendMessage: (message: string) => Promise<void>;
  loadPackageConfig: (packageName: string) => Promise<void>;
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
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Extract package name from URL path (e.g., "/core" -> "core")
  const currentPackageFromUrl = useMemo(() => {
    if (pathname && pathname !== "/") {
      const segments = pathname.split("/").filter(Boolean);
      return segments[0] || null; // First segment is the package name
    }
    return null;
  }, [pathname]);

  // Use URL package or fallback to initialPackage prop
  const targetPackage = currentPackageFromUrl || initialPackage;

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

  // Package state (from PackageContext)
  const [packageConfig, setPackageConfig] = useState<PackageConfig | null>(
    null
  );
  const [packageLoading, setPackageLoading] = useState(false);
  const [packageState, setPackageState] = useState<PackageState>({
    currentPackage: "",
    currentRoute: "home",
    agentPanelOpen: false,
    agentWidth: 320,
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Reset loaded flags when user changes
  useEffect(() => {
    setPreferencesLoaded(false);
    setAppsLoaded(false);
  }, [session?.user?.id]);

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
  }, [session?.user?.id, preferencesLoaded, preferencesLoading]); // More specific dependencies

  // Fetch available apps
  useEffect(() => {
    async function fetchAvailableApps() {
      if (!session?.user) {
        setAvailableApps([]);
        setAppsLoaded(false);
        return;
      }

      // Prevent multiple calls
      if (appsLoaded || appsLoading) {
        return;
      }

      console.log("🔄 Loading available apps...");
      setAppsLoading(true);
      try {
        const response = await apiClient.run({
          service: "dynamo",
          operation: "scan",
          app: "core",
          table: "App",
          data: {
            filters: [{ attribute: "status", value: "active" }],
          },
        });

        if (response.success && response.data?.Items) {
          setAvailableApps(response.data.Items as App[]);
        } else {
          setAvailableApps([]);
        }
        setAppsLoaded(true);
        console.log("✅ Available apps loaded successfully");
      } catch (error) {
        console.error("❌ Error fetching available apps:", error);
        setAvailableApps([]);
        setAppsLoaded(true); // Mark as loaded even on error to prevent retries
      } finally {
        setAppsLoading(false);
      }
    }

    if (session) {
      fetchAvailableApps();
    }
  }, [session?.user?.id, appsLoaded, appsLoading]); // More specific dependencies

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

  // Package functionality (from PackageContext)
  const loadPackageConfig = useCallback(
    async (packageName: string) => {
      // Prevent loading the same package multiple times
      if (packageLoading || packageState.currentPackage === packageName) {
        console.log(
          `🚫 Skipping loadPackageConfig for ${packageName} - already loading or loaded`
        );
        return;
      }

      console.log(`🔄 Loading package config for ${packageName}...`);
      try {
        setPackageLoading(true);
        setPackageState((prev) => ({ ...prev, currentPackage: packageName }));

        // Load app config from DynamoDB
        const appResponse = await apiClient.run({
          service: "dynamo",
          operation: "scan",
          table: "App",
          data: {
            FilterExpression: "slug = :slug",
            ExpressionAttributeValues: {
              ":slug": packageName,
            },
            Limit: 1,
          },
        });

        if (
          !appResponse.success ||
          !appResponse.data?.Items ||
          appResponse.data.Items.length === 0
        ) {
          // Create default configuration if not found
          const defaultConfig: PackageConfig = {
            id: packageName as `${string}-${string}-${string}-${string}-${string}`,
            name: packageName.charAt(0).toUpperCase() + packageName.slice(1),
            slug: packageName,
            app: packageName,
            fields: {},
            description: `Default configuration for ${packageName}`,
            ownerId: "system",
            version: "1.0.0",
            category: "other",
            status: "active",
            visibility: "internal",
            icon: "package",
            menu: [],
            identityPoolId: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "system",
            updatedBy: "system",
            menuItems: [],
            defaultRoute: "home",
            agentConfig: {
              agentId: "",
              agentAliasId: "",
              capabilities: [],
            },
          };

          setPackageConfig(defaultConfig);
          setPackageLoading(false);
          return;
        }

        const app = appResponse.data.Items[0];

        // Menu data is already included in the app record
        const menuItems: PackageMenuItem[] = app.menu || [];

        // Combine into package config
        const config: PackageConfig = {
          ...app,
          menuItems,
          defaultRoute: app.defaultRoute || "home",
          agentConfig: {
            agentId: app.agentId || "",
            agentAliasId: app.agentAliasId || "",
            capabilities: app.capabilities || [],
          },
        };

        setPackageConfig(config);

        // Set initial route from URL hash or default
        const hashRoute = window.location.hash.replace("#", "");
        if (hashRoute && menuItems.some((item) => item.route === hashRoute)) {
          setPackageState((prev) => ({ ...prev, currentRoute: hashRoute }));
        } else {
          setPackageState((prev) => ({
            ...prev,
            currentRoute: config.defaultRoute,
          }));
        }
        console.log(`✅ Package config loaded successfully for ${packageName}`);
      } catch (error) {
        console.error(
          `❌ Failed to load package config for ${packageName}:`,
          error
        );
      } finally {
        setPackageLoading(false);
      }
    },
    [packageLoading, packageState.currentPackage]
  );

  // Auto-load package when target package changes
  useEffect(() => {
    if (targetPackage && targetPackage !== packageState.currentPackage) {
      console.log(
        `🔄 Auto-loading package config for ${targetPackage} (from URL: ${pathname})`
      );
      loadPackageConfig(targetPackage);
    }
  }, [targetPackage, packageState.currentPackage, loadPackageConfig, pathname]);

  // Navigation functions
  const setCurrentRoute = useCallback((route: string) => {
    setPackageState((prev) => ({ ...prev, currentRoute: route }));
    window.location.hash = route;
  }, []);

  // Panel control functions
  const toggleAgentPanel = useCallback(() => {
    setPackageState((prev) => ({
      ...prev,
      agentPanelOpen: !prev.agentPanelOpen,
    }));
  }, []);

  const setAgentWidth = useCallback((width: number) => {
    setPackageState((prev) => ({ ...prev, agentWidth: width }));
  }, []);

  // Chat functionality
  const sendMessage = useCallback(
    async (message: string) => {
      if (!packageConfig?.agentConfig) return;

      // Add user message to history
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, userMessage]);

      try {
        // Send to agent using existing Bedrock integration
        const response = await apiClient.run({
          service: "bedrock-agent",
          operation: "invoke",
          data: {
            agentId: packageConfig.agentConfig.agentId,
            agentAliasId: packageConfig.agentConfig.agentAliasId,
            sessionId: session?.user?.email || "anonymous",
            inputText: message,
            context: {
              packageName: packageState.currentPackage,
              currentRoute: packageState.currentRoute,
              userId: session?.user?.email,
            },
          },
        });

        if (response.success) {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              response.data?.completion ||
              "Sorry, I couldn't process that request.",
            timestamp: new Date(),
          };

          setChatHistory((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [packageConfig, packageState, session]
  );

  // Context value
  const contextValue: CaptifyContextType = useMemo(
    () => ({
      session,
      sessionStatus: status,
      isAuthenticated,
      userPreferences,
      preferencesLoading,
      updatePreferences,
      favoriteApps,
      toggleFavorite,
      appContext,
      setCurrentApp,
      getCurrentAppConfig,
      packageConfig,
      packageLoading,
      packageState,
      setCurrentRoute,
      toggleAgentPanel,
      setAgentWidth,
      chatHistory,
      sendMessage,
      loadPackageConfig,
    }),
    [
      session,
      isAuthenticated,
      userPreferences,
      preferencesLoading,
      updatePreferences,
      favoriteApps,
      toggleFavorite,
      appContext,
      setCurrentApp,
      getCurrentAppConfig,
      packageConfig,
      packageLoading,
      packageState,
      setCurrentRoute,
      toggleAgentPanel,
      setAgentWidth,
      chatHistory,
      sendMessage,
      loadPackageConfig,
    ]
  );

  return (
    <CaptifyContext.Provider value={contextValue}>
      {children}
    </CaptifyContext.Provider>
  );
}

export function useCaptify(): CaptifyContextType {
  const context = useContext(CaptifyContext);
  console.log("🔍 useCaptify context:", context);
  if (context === undefined) {
    throw new Error("useCaptify must be used within a CaptifyProvider");
  }
  return context;
}
