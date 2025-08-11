"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface NavigationContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  navigateTo: (href: string) => void;
  currentPath: string;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

interface NavigationProviderProps {
  children: React.ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  const addBreadcrumb = (item: BreadcrumbItem) => {
    setBreadcrumbs((prev) => [...prev, item]);
  };

  const navigateTo = (href: string) => {
    router.push(href);
  };

  // Auto-generate breadcrumbs based on pathname
  useEffect(() => {
    const generateBreadcrumbs = (path: string): BreadcrumbItem[] => {
      const segments = path.split("/").filter(Boolean);
      const breadcrumbs: BreadcrumbItem[] = [];

      // Always add home
      breadcrumbs.push({
        label: "Captify",
        href: "/",
      });

      let currentPath = "";
      for (let i = 0; i < segments.length; i++) {
        currentPath += `/${segments[i]}`;
        const segment = segments[i];
        const isLast = i === segments.length - 1;

        // Generate breadcrumb based on path patterns
        let label = segment;
        let href = isLast ? undefined : currentPath;

        if (segment === "admin") {
          label = "Administration";
        } else if (segment === "applications") {
          label = "Applications";
        } else if (segment === "agents") {
          label = "AI Agents";
        } else if (segment === "apps") {
          label = "Applications";
        } else if (segment === "settings") {
          label = "Settings";
        } else if (segment === "profile") {
          label = "Profile";
        } else if (segment === "console") {
          label = "Console";
        } else if (segment === "search") {
          label = "Search";
        } else if (segment === "new") {
          label = "New";
          href = undefined; // Don't make "new" clickable
        } else {
          // For dynamic segments like [id], [alias], try to make them more readable
          if (segment.length > 8) {
            label = segment.substring(0, 8) + "...";
          } else {
            label = segment.charAt(0).toUpperCase() + segment.slice(1);
          }
        }

        breadcrumbs.push({
          label,
          href,
          isActive: isLast,
        });
      }

      return breadcrumbs;
    };

    setBreadcrumbs(generateBreadcrumbs(pathname));
  }, [pathname]);

  return (
    <NavigationContext.Provider
      value={{
        breadcrumbs,
        setBreadcrumbs,
        addBreadcrumb,
        navigateTo,
        currentPath: pathname,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
