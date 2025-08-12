"use client";

import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApplicationData } from "@/hooks/useApplicationData";

interface ApplicationData {
  id: string;
  slug: string;
  name: string;
  title?: string;
  description?: string;
  version?: string;
  agentId?: string;
  agentAliasId?: string;
  menu?: Array<{
    id: string;
    label: string;
    icon: string;
    href?: string;
    order?: number;
    parent_id?: string;
  }>;
  capabilities?: string[];
  permissions?: string[];
  category?: string;
  status?: string;
}

interface ApplicationContextType {
  applicationData: ApplicationData | null;
  loading: boolean;
  error: string | null;
  slug: string;
  // Legacy compatibility
  applicationInfo: ApplicationData | null;
  agentId: string | undefined;
  agentAliasId: string | undefined;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(
  undefined
);

interface ApplicationProviderProps {
  children: ReactNode;
}

export function ApplicationProvider({ children }: ApplicationProviderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Extract slug from pathname (e.g., /console -> console, /apps/mi -> apps/mi)
  const slug = useMemo(() => {
    if (!pathname) return "";

    // Remove leading slash and extract the slug
    const pathParts = pathname.split("/").filter(Boolean);

    if (pathParts.length === 0) return "";

    // For paths like /app/console, slug = "console"
    // For paths like /app/mi, slug = "mi"
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

  // Check if we should fetch application data
  const shouldFetchData = useMemo(() => {
    const isAuthPage = pathname?.startsWith("/auth/");
    const isPublicPage = pathname === "/" || pathname?.startsWith("/public/");
    const isAuthenticated = status === "authenticated" && session;

    return !isAuthPage && !isPublicPage && isAuthenticated && slug;
  }, [pathname, status, session, slug]);

  // Fetch application data based on slug, but only when authenticated and on appropriate pages
  const {
    data: applicationData,
    loading,
    error,
  } = useApplicationData(shouldFetchData ? slug : "");

  const contextValue: ApplicationContextType = {
    applicationData,
    loading,
    error,
    slug,
    // Legacy compatibility
    applicationInfo: applicationData,
    agentId: applicationData?.agentId,
    agentAliasId: applicationData?.agentAliasId,
  };

  return (
    <ApplicationContext.Provider value={contextValue}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplication() {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error(
      "useApplication must be used within an ApplicationProvider"
    );
  }
  return context;
}
