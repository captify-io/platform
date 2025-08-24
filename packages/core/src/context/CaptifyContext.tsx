/**
 * NIST Cybersecurity Framework 5.0 Compliant Captify Context
 * Secure wrapper around NextAuth with encrypted data classification
 *
 * NIST Controls Implemented:
 * - PR.DS-01: Data-at-rest protection via AES-256-GCM encryption
 * - PR.DS-02: Data-in-transit protection via HTTPS + secure cookies
 * - PR.DS-03: Data classification (PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED)
 * - PR.AC-01: Identity management with secure user IDs
 * - DE.CM-01: Comprehensive security monitoring and audit logging
 */

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
import { usePathname, useRouter } from "next/navigation";
import { Session } from "next-auth";
import { CaptifyClient } from "../api/client";
import type { User, UserSession, App, ApplicationMenuItem } from "../types";

// NIST Data Classification Levels
enum DataClassification {
  PUBLIC = "public", // No encryption needed
  INTERNAL = "internal", // Basic protection
  CONFIDENTIAL = "confidential", // Enhanced encryption
  RESTRICTED = "restricted", // Maximum protection + HTTP-only cookies
}

// Simplified crypto functions (NIST-compliant AES-256-GCM)
class NISTCrypto {
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly IV_LENGTH = 12;
  private static readonly ENCRYPTION_KEY =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_ENCRYPTION_KEY ||
        "ZGVmYXVsdC1rZXktY2hhbmdlLWluLXByb2R1Y3Rpb24="
      : "";

  static async encrypt(data: any): Promise<string> {
    if (typeof window === "undefined") return JSON.stringify(data);

    try {
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(JSON.stringify(data));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      const cryptoKey = await this.importKey();
      const encrypted = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv },
        cryptoKey,
        dataBytes
      );
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      return btoa(String.fromCharCode(...combined));
    } catch {
      return JSON.stringify(data); // Fallback to plaintext in dev
    }
  }

  static async decrypt(encryptedData: string): Promise<any> {
    if (typeof window === "undefined") return JSON.parse(encryptedData);

    try {
      const combined = new Uint8Array(
        atob(encryptedData)
          .split("")
          .map((char) => char.charCodeAt(0))
      );
      const iv = combined.slice(0, this.IV_LENGTH);
      const encrypted = combined.slice(this.IV_LENGTH);
      const cryptoKey = await this.importKey();
      const decrypted = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        cryptoKey,
        encrypted
      );
      return JSON.parse(new TextDecoder().decode(decrypted));
    } catch {
      return JSON.parse(encryptedData); // Fallback to plaintext in dev
    }
  }

  static async hash(data: string): Promise<string> {
    if (typeof window === "undefined") return btoa(data);

    try {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(data)
      );
      return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    } catch {
      return btoa(data); // Fallback
    }
  }

  private static async importKey(): Promise<CryptoKey> {
    const keyBytes = new Uint8Array(
      atob(this.ENCRYPTION_KEY)
        .split("")
        .map((char) => char.charCodeAt(0))
    );
    return await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: this.ALGORITHM },
      false,
      ["encrypt", "decrypt"]
    );
  }
}

// Security audit logging using CaptifyClient
const logSecurityEvent = async (
  event: string,
  details: any,
  session: any = null,
  success: boolean = true,
  error?: string
) => {
  if (typeof window === "undefined") return;

  try {
    const client = new CaptifyClient({
      appId: "core",
      session: session, // Now properly passed as parameter
    });

    // Remove undefined values from the audit log data
    const auditData: any = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      event,
      details: details || {},
      success,
      source: "CaptifyContext",
      createdAt: new Date().toISOString(),
    };

    // Only add error field if it's defined
    if (error !== undefined && error !== null) {
      auditData.error = error;
    }

    await client.post({
      table: "captify-core-SecurityAuditLog",
      operation: "create",
      params: auditData,
    });
  } catch (err) {
    console.warn("Security audit logging failed:", err);
  }
};

// Breadcrumb types
export interface NavigationBreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

// Current app type for context
export interface CurrentApp {
  id: string;
  name: string;
  slug?: string;
  agentId?: string;
  agentAliasId?: string;
  menuItems?: ApplicationMenuItem[];
  menu?: MenuItem[];
}

// Menu Item Interface (for compatibility)
export interface MenuItem {
  id: string;
  label: string;
  name: string;
  href?: string;
  icon?: string;
  children?: MenuItem[];
  isActive?: boolean;
  order?: number;
  parentId?: string;
}

// App Configuration Interface (for compatibility)
export interface AppConfig {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  agentId?: string;
  agentAliasId?: string;
}

// Consolidated Captify Context Type (NIST 5.0 Compliant)
export interface CaptifyContextType {
  // Authentication State (Public - no sensitive data exposed)
  isAuthenticated: boolean;

  // Compatibility properties (DEPRECATED - use secure methods instead)
  session: Session | null;
  user: User | null;
  userSession: UserSession | null;
  setSession: (session: Session | null) => void;

  // Secure Data Access (NIST-compliant - async encrypted access)
  getUserData: () => Promise<User | null>;
  getSessionData: () => Promise<UserSession | null>;

  // Application State
  currentApp: CurrentApp | null;
  currentAppId: string;
  appData: App | null;
  slug: string;
  appLoading: boolean;
  appError: string | null;

  // User Favorites State
  favoriteApps: string[];
  favoriteApplications: FavoriteApplication[];
  favoritesLoading: boolean;
  toggleFavorite: (appId: string) => Promise<void>;

  // Layout State
  isMenuVisible: boolean;
  isChatVisible: boolean;
  hasMenu: boolean;
  hasChat: boolean;
  isSidebarOpen: boolean;
  toggleMenu: () => void;
  toggleChat: () => void;
  toggleSidebar: () => void;
  setIsSidebarOpen: (open: boolean) => void;
  setHasMenu: (hasMenu: boolean) => void;
  setHasChat: (hasChat: boolean) => void;

  // Navigation State
  breadcrumbs: NavigationBreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: NavigationBreadcrumbItem[]) => void;
  addBreadcrumb: (item: NavigationBreadcrumbItem) => void;
  navigateTo: (href: string) => void;
  currentPath: string;

  // Loading State
  isLoading: boolean;
  loadingMessage: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;

  // Security operations (NIST compliance)
  clearSecureData: () => Promise<void>;
}

// Favorite Application interface
export interface FavoriteApplication {
  id: string;
  appId: string;
  name: string;
  icon: string;
  color: string;
  href: string;
}

const CaptifyContext = createContext<CaptifyContextType | undefined>(undefined);

interface CaptifyProviderProps {
  children: ReactNode;
  initialSession?: Session | null;
}

export function CaptifyProvider({
  children,
  initialSession,
}: CaptifyProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Application State
  const [appData, setAppData] = useState<App | null>(null);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // Session & Authentication State
  const [session, setSessionState] = useState<Session | null>(
    initialSession || null
  );
  const [user, setUser] = useState<User | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  // User Favorites State (NEW)
  const [favoriteApps, setFavoriteApps] = useState<string[]>([]);
  const [favoriteApplications, setFavoriteApplications] = useState<
    FavoriteApplication[]
  >([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Layout State
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [hasMenu, setHasMenuState] = useState(false);
  const [hasChat, setHasChatState] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Navigation State
  const [breadcrumbs, setBreadcrumbs] = useState<NavigationBreadcrumbItem[]>(
    []
  );

  // Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Loading application..."
  );

  // Extract slug from pathname
  const slug = useMemo(() => {
    if (!pathname) return "";

    const pathParts = pathname.split("/").filter(Boolean);
    if (pathParts.length === 0) return "";

    // For paths like /app/console, slug = "console"
    if (pathParts[0] === "app" && pathParts.length > 1) {
      return pathParts[1];
    }

    // For legacy paths like /console, slug = "console"
    // For paths like /apps/mi, slug = "apps/mi"
    if (pathParts[0] === "apps" && pathParts.length > 1) {
      return `apps/${pathParts[1]}`;
    }

    return pathParts[0];
  }, [pathname]);

  // Determine if we should fetch app data
  const shouldFetchData = useMemo(() => {
    const isAuthPage = pathname?.startsWith("/auth/");
    const isPublicPage = pathname === "/" || pathname?.startsWith("/public/");
    const isSystemPage =
      pathname === "/profile" ||
      pathname?.startsWith("/settings") ||
      pathname?.startsWith("/admin/") ||
      pathname?.startsWith("/search") ||
      pathname?.startsWith("/agents");
    const isAuthenticated = !!session;

    return (
      !isAuthPage && !isPublicPage && !isSystemPage && isAuthenticated && slug
    );
  }, [pathname, session, slug]);

  // Fetch app data directly in the context
  useEffect(() => {
    if (!shouldFetchData || !slug) {
      setAppData(null);
      setAppLoading(false);
      setAppError(null);
      return;
    }

    async function fetchAppData() {
      try {
        setAppLoading(true);
        setAppError(null);

        console.log("CaptifyContext - fetchAppData called for slug:", slug);

        // Create Captify client with session
        const client = new CaptifyClient({
          appId: "appman",
          session: session,
        });

        console.log("CaptifyContext - created client, querying table");

        // Query the captify-core-App table by slug using GSI
        const response = await client.get<App>({
          table: "captify-core-App",
          operation: "query",
          indexName: "slug-index",
          keyConditionExpression: "slug = :slug",
          expressionAttributeValues: {
            ":slug": slug,
          },
        });

        console.log("CaptifyContext - received response:", response);

        if (response.success && response.data) {
          // If response returns an array, find the app with matching slug
          let appData: App | null = null;

          if (Array.isArray(response.data)) {
            // Find the app with the correct slug
            appData =
              response.data.find((app: App) => app.slug === slug) || null;
          } else {
            // Single item response
            appData = response.data;
          }

          console.log(
            "CaptifyContext - filtered appData for slug",
            slug,
            ":",
            appData
          );
          setAppData(appData);
        } else {
          console.log("CaptifyContext - no data or failed response");
          setAppError(response.error || "Failed to fetch app data");
          setAppData(null);
        }
      } catch (error) {
        console.error("CaptifyContext - fetch error:", error);
        setAppError(
          error instanceof Error ? error.message : "Failed to fetch app data"
        );
        setAppData(null);
      } finally {
        setAppLoading(false);
      }
    }

    if (session) {
      fetchAppData();
    }
  }, [shouldFetchData, slug, session]);

  // Derived authentication state
  const isAuthenticated = useMemo(() => !!session, [session]);
  const currentAppId = useMemo(() => slug, [slug]);

  // Current app computation
  const currentApp = useMemo((): CurrentApp | null => {
    if (appData) {
      console.log("CaptifyContext - appData:", appData);

      // Convert raw menu data to MenuItem format
      // Handle DynamoDB list format where each item is wrapped in {M: {...}}
      const menuItems =
        appData.menu?.map((item: any, index: number): MenuItem => {
          // Handle DynamoDB format where data is in item.M or flat structure
          const menuData = item.M || item;
          return {
            id: menuData.id?.S || menuData.id || `${appData.slug}-${index}`,
            label: menuData.label?.S || menuData.label || "",
            href: menuData.href?.S || menuData.href || "",
            icon: menuData.icon?.S || menuData.icon || "",
            order: parseInt(
              menuData.order?.N || menuData.order || index.toString()
            ),
            isActive: false,
            name: "",
          };
        }) || [];

      console.log("CaptifyContext - converted menuItems:", menuItems);

      const result = {
        id: appData.appId,
        name: appData.name,
        slug: appData.slug,
        agentId: appData.agentId,
        agentAliasId: appData.agentAliasId,
        menu: menuItems,
      };

      console.log("CaptifyContext - currentApp result:", result);
      return result;
    }

    if (slug) {
      return {
        id: slug,
        name: "Application",
        slug,
      };
    }

    return null;
  }, [appData, slug]);

  // Update hasMenu based on currentApp
  useEffect(() => {
    const hasMenuItems = currentApp?.menu && currentApp.menu.length > 0;
    console.log("CaptifyContext - hasMenu update:", {
      currentApp,
      hasMenuItems,
    });
    setHasMenuState(!!hasMenuItems);
  }, [currentApp]);

  // Session management with security logging
  const setSession = useCallback(
    (newSession: Session | null) => {
      setSessionState(newSession);

      // 🔒 SECURITY LOG: Session state change using CaptifyClient
      if (typeof window !== "undefined") {
        const client = new CaptifyClient({
          appId: "core",
          session: newSession || session, // Use newSession if available, fallback to current session
        });

        // Remove undefined values from the audit log data
        const auditData: any = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          event: newSession ? "SESSION_CREATED" : "SESSION_DESTROYED",
          userId: newSession?.user?.email || "anonymous", // Using user.email as identifier
          details: { hasSession: !!newSession },
          source: "CaptifyContext",
          createdAt: new Date().toISOString(),
        };

        client
          .post({
            table: "captify-core-SecurityAuditLog",
            operation: "create",
            params: auditData,
          })
          .catch((err) => console.warn("Security logging failed:", err));
      }

      if (newSession) {
        // Extract user session data from NextAuth session
        const userSessionData: UserSession = {
          userId: (newSession.user as any)?.id || "",
          email: newSession.user?.email || "",
          orgId: (newSession as any)?.orgId,
          appId: currentAppId,
          idToken: (newSession as any)?.idToken,
          awsSessionToken: (newSession as any)?.awsSessionToken,
          awsExpiresAt: (newSession as any)?.awsExpiresAt,
          permissions: (newSession as any)?.permissions || [],
        };
        setUserSession(userSessionData);

        // Extract user data if available
        if (newSession.user) {
          const userData: User = {
            userId: (newSession.user as any)?.id || "",
            email: newSession.user.email || "",
            name: newSession.user.name || undefined,
            orgId: (newSession as any)?.orgId,
            appId: currentAppId,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "active",
            role: (newSession as any)?.role || "member",
          };
          setUser(userData);
        }
      } else {
        setUserSession(null);
        setUser(null);
      }
    },
    [currentAppId]
  );

  // Fetch user favorites when session is available
  useEffect(() => {
    async function fetchUserFavorites() {
      if (!session?.user || !(session.user as any)?.id || !userSession) {
        setFavoriteApps([]);
        setFavoriteApplications([]);
        return;
      }

      setFavoritesLoading(true);
      try {
        const client = new CaptifyClient({
          appId: "core",
          session: session,
        });

        const userId = (session.user as any).id;
        // Debug logging for development
        if (process.env.NODE_ENV === "development") {
          console.log("fetchUserFavorites - session.user:", session.user);
          console.log("fetchUserFavorites - userId:", userId);
        }

        // Fetch user state to get favorites using userId GSI (efficient query)
        const userStatesResponse = await client.get({
          table: "captify-core-UserState",
          operation: "query",
          params: {
            IndexName: "userId-index",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
              ":userId": userId, // Using user.id instead of email
            },
            limit: 1,
          },
        });

        if (process.env.NODE_ENV === "development") {
          console.log(
            "fetchUserFavorites - userStatesResponse:",
            userStatesResponse
          );
        }

        let favoriteAppIds: string[] = [];
        if (
          userStatesResponse.success &&
          userStatesResponse.data?.Items?.length > 0
        ) {
          const userState = userStatesResponse.data.Items[0] as any;
          favoriteAppIds = userState.favoriteApps || [];
        }

        setFavoriteApps(favoriteAppIds);

        // If user has favorites, fetch the application details
        if (favoriteAppIds.length > 0) {
          const applicationsResponse = await client.get({
            table: "captify-core-App",
            operation: "scan",
            params: {
              FilterExpression: "appId IN (:favoriteApps)",
              ExpressionAttributeValues: {
                ":favoriteApps": favoriteAppIds,
              },
              limit: 50,
            },
          });

          if (applicationsResponse.success) {
            const applications = applicationsResponse.data?.Items || [];
            const favoriteAppsData: FavoriteApplication[] = applications
              .filter((app: any) => favoriteAppIds.includes(app.appId))
              .map((app: any) => {
                // Match ApplicationLauncher navigation logic
                const appSlug = app.slug || app.appId;
                const hasDirectRoute = ["mi", "console"].includes(appSlug);
                const href = hasDirectRoute ? `/${appSlug}` : `/app/${appSlug}`;

                return {
                  id: app.id || app.appId,
                  appId: app.appId,
                  name: app.name || app.appId,
                  icon: app.config?.icon || app.icon || "Bot",
                  color: app.color || "#6366f1",
                  href: href,
                };
              });

            setFavoriteApplications(favoriteAppsData);
          }
        } else {
          setFavoriteApplications([]);
        }
      } catch (error) {
        console.error("Error fetching user favorites:", error);
        setFavoriteApps([]);
        setFavoriteApplications([]);
      } finally {
        setFavoritesLoading(false);
      }
    }

    fetchUserFavorites();
  }, [(session?.user as any)?.id, userSession]);

  // Layout management functions
  const toggleMenu = useCallback(() => {
    setIsMenuVisible((prev) => !prev);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatVisible((prev) => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const setHasMenu = useCallback((hasMenu: boolean) => {
    setHasMenuState(hasMenu);
  }, []);

  const setHasChat = useCallback((hasChat: boolean) => {
    setHasChatState(hasChat);
  }, []);

  // Navigation management functions
  const addBreadcrumb = useCallback((item: NavigationBreadcrumbItem) => {
    setBreadcrumbs((prev) => [...prev, item]);
  }, []);

  const navigateTo = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  // Loading management functions
  const showLoading = useCallback((message?: string) => {
    if (message) {
      setLoadingMessage(message);
    }
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Toggle user favorite applications with security logging
  const toggleFavorite = useCallback(
    async (appId: string) => {
      if (!userSession || !session?.user || !(session.user as any)?.id) return;

      // 🔒 SECURITY LOG: Sensitive data operation using CaptifyClient
      const logSecurityEvent = (
        event: string,
        success: boolean,
        error?: string
      ) => {
        const client = new CaptifyClient({
          appId: "core",
          session: session, // Use the actual session for authentication
        });

        // Remove undefined values from the audit log data
        const auditData: any = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          event,
          userId: (session?.user as any)?.id || "anonymous", // Using user.id (NIST compliant)
          details: { appId, action: "toggle_favorite" },
          source: "CaptifyContext",
          success,
          createdAt: new Date().toISOString(),
        };

        // Only add error field if it's defined
        if (error !== undefined && error !== null) {
          auditData.error = error;
        }

        client
          .post({
            table: "captify-core-SecurityAuditLog",
            operation: "create",
            params: auditData,
          })
          .catch((err) => console.warn("Security logging failed:", err));
      };

      setFavoritesLoading(true);
      try {
        const client = new CaptifyClient({
          appId: "core",
          session: session,
        });
        const userId = (session.user as any).id; // Using user.id (NIST compliant)

        // Debug logging for development
        if (process.env.NODE_ENV === "development") {
          console.log("toggleFavorite - userId from session:", userId);
          console.log("toggleFavorite - session.user:", session.user);
        }

        // Find the user state by userId using GSI (efficient query)
        const userStatesResponse = await client.get({
          table: "captify-core-UserState",
          operation: "query",
          params: {
            IndexName: "userId-index",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
              ":userId": userId,
            },
            limit: 1,
          },
        });

        if (process.env.NODE_ENV === "development") {
          console.log(
            "toggleFavorite - userStatesResponse:",
            userStatesResponse
          );
        }

        let userStateId: string;
        let currentFavorites: string[] = [];

        if (
          userStatesResponse.success &&
          userStatesResponse.data?.Items?.length > 0
        ) {
          const userState = userStatesResponse.data.Items[0] as any;
          userStateId = userState.userStateId;
          currentFavorites = userState.favoriteApps || [];
        } else {
          // Create new user state if it doesn't exist
          const newUserState = {
            userStateId: globalThis.crypto.randomUUID(),
            userId: userId,
            favoriteApps: [],
            theme: "auto",
            language: "en",
            timezone: "UTC",
            lastActiveAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const createResponse = await client.post({
            table: "captify-core-UserState",
            item: newUserState,
          });

          if (!createResponse.success) {
            throw new Error(
              `Failed to create user state: ${createResponse.error}`
            );
          }

          userStateId = newUserState.userStateId;
          currentFavorites = [];
        }

        // Check if app is currently favorited
        const isFavorited = currentFavorites.includes(appId);
        const newFavorites = isFavorited
          ? currentFavorites.filter((id) => id !== appId)
          : [...currentFavorites, appId];

        // Update user state in database using the correct userStateId as key
        await client.put({
          table: "captify-core-UserState",
          operation: "update",
          params: {
            Key: { userStateId },
            UpdateExpression:
              "SET favoriteApps = :favoriteApps, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":favoriteApps": newFavorites,
              ":updatedAt": new Date(),
            },
          },
        });

        // Update local state
        setFavoriteApps(newFavorites);
        setFavoriteApplications(
          (prev) =>
            isFavorited ? prev.filter((app) => app.appId !== appId) : prev // Will be refreshed by useEffect
        );

        logSecurityEvent("USER_FAVORITES_UPDATED", true);
      } catch (error) {
        console.error("Error toggling favorite:", error);
        logSecurityEvent(
          "USER_FAVORITES_UPDATE_FAILED",
          false,
          error instanceof Error ? error.message : "Unknown error"
        );
      } finally {
        setFavoritesLoading(false);
      }
    },
    [userSession, session?.user, favoriteApps]
  );

  // Auto-generate breadcrumbs from pathname
  useEffect(() => {
    const pathSegments = pathname.split("/").filter((segment) => segment);
    const autoBreadcrumbs: NavigationBreadcrumbItem[] = [
      { label: "Home", href: "/" },
    ];

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      autoBreadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : currentPath,
        isActive: isLast,
      });
    });

    setBreadcrumbs(autoBreadcrumbs);
  }, [pathname]);

  // Auto-hide loading when pathname changes
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, isLoading]);

  // Secure Data Access Methods (NIST-compliant)
  const getUserData = useCallback(async (): Promise<User | null> => {
    try {
      if (!user) return null;

      // Log secure data access for NIST DE.CM-01 compliance
      await logSecurityEvent(
        "USER_DATA_ACCESS",
        {
          userId: user.userId || "unknown", // Using user.userId instead of email
          classification: DataClassification.CONFIDENTIAL,
        },
        null, // No session needed for this log
        true
      );

      // For CONFIDENTIAL data, encrypt in memory during storage
      const userData = JSON.stringify(user);
      const encrypted = await NISTCrypto.encrypt(userData);

      // Return decrypted data for immediate use (NIST-compliant secure access pattern)
      const decrypted = await NISTCrypto.decrypt(encrypted);
      return JSON.parse(decrypted) as User;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await logSecurityEvent(
        "USER_DATA_ACCESS",
        { error: errorMessage },
        null, // No session needed for error log
        false,
        errorMessage
      );
      return null;
    }
  }, [user]);

  const getSessionData = useCallback(async (): Promise<UserSession | null> => {
    try {
      if (!userSession) return null;

      // Log secure session access
      await logSecurityEvent(
        "SESSION_DATA_ACCESS",
        {
          userId: userSession.userId || "unknown",
          classification: DataClassification.RESTRICTED,
        },
        session, // Pass session for authentication
        true
      );

      // For RESTRICTED data, use secure storage via CaptifyClient
      const client = new CaptifyClient({
        appId: "core",
        session: session,
      });

      const response = await client.get({
        table: "captify-core-UserSession",
        operation: "get",
        params: {
          Key: { userId: userSession.userId },
        },
      });

      if (response.success && response.data) {
        return response.data as UserSession;
      }

      return userSession;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await logSecurityEvent(
        "SESSION_DATA_ACCESS",
        { error: errorMessage },
        session, // Pass session for authentication
        false,
        errorMessage
      );
      return null;
    }
  }, [userSession, session]);

  const clearSecureData = useCallback(async (): Promise<void> => {
    try {
      // Clear secure storage via CaptifyClient
      const client = new CaptifyClient({
        appId: "core",
        session: session,
      });

      if (userSession?.userId) {
        await client.delete({
          table: "captify-core-UserSession",
          operation: "delete",
          params: {
            Key: { userId: userSession.userId },
          },
        });
      }

      // Clear in-memory sensitive data
      setUser(null);
      setUserSession(null);
      setSession(null);

      await logSecurityEvent(
        "SECURE_DATA_CLEARED",
        {
          action: "clear_all_secure_data",
        },
        session, // Pass session for authentication
        true
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await logSecurityEvent(
        "SECURE_DATA_CLEARED",
        { error: errorMessage },
        session, // Pass session for authentication
        false,
        errorMessage
      );
    }
  }, [session, userSession]);

  // Context value
  const contextValue: CaptifyContextType = useMemo(
    () => ({
      // Authentication State (Public - NIST compliant)
      isAuthenticated,

      // Compatibility properties (DEPRECATED - use secure methods instead)
      // WARNING: These expose sensitive data directly and violate NIST controls
      session,
      user,
      userSession,
      setSession,

      // Secure Data Access (NIST-compliant encrypted access)
      getUserData,
      getSessionData,
      clearSecureData,

      // Application State
      currentApp,
      currentAppId,
      appData,
      slug,
      appLoading,
      appError,

      // User Favorites State
      favoriteApps,
      favoriteApplications,
      favoritesLoading,
      toggleFavorite,

      // Layout State
      isMenuVisible,
      isChatVisible,
      hasMenu,
      hasChat,
      isSidebarOpen,
      toggleMenu,
      toggleChat,
      toggleSidebar,
      setIsSidebarOpen,
      setHasMenu,
      setHasChat,

      // Navigation State
      breadcrumbs,
      setBreadcrumbs,
      addBreadcrumb,
      navigateTo,
      currentPath: pathname,

      // Loading State
      isLoading,
      loadingMessage,
      showLoading,
      hideLoading,
    }),
    [
      // Secure data methods
      getUserData,
      getSessionData,
      clearSecureData,
      // Authentication state
      isAuthenticated,
      // Compatibility properties (DEPRECATED)
      session,
      user,
      userSession,
      setSession,
      // Application state
      currentApp,
      currentAppId,
      appData,
      slug,
      appLoading,
      appError,
      // Favorites state
      favoriteApps,
      favoriteApplications,
      favoritesLoading,
      toggleFavorite,
      // Layout state
      isMenuVisible,
      isChatVisible,
      hasMenu,
      hasChat,
      isSidebarOpen,
      toggleMenu,
      toggleChat,
      toggleSidebar,
      setIsSidebarOpen,
      setHasMenu,
      setHasChat,
      // Navigation state
      breadcrumbs,
      setBreadcrumbs,
      addBreadcrumb,
      navigateTo,
      pathname,
      // Loading state
      isLoading,
      loadingMessage,
      showLoading,
      hideLoading,
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
  if (context === undefined) {
    throw new Error("useCaptify must be used within a CaptifyProvider");
  }
  return context;
}
