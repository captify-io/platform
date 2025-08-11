"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useNavigation, BreadcrumbItem } from "@/context/NavigationContext";
import { useApplication } from "@/context/ApplicationContext";

/**
 * Hook to customize breadcrumbs for specific pages
 * Usage: useBreadcrumbs([{ label: "Custom Page", href: "/custom" }])
 */
export function useBreadcrumbs(customBreadcrumbs?: BreadcrumbItem[]) {
  const { setBreadcrumbs } = useNavigation();

  useEffect(() => {
    if (customBreadcrumbs) {
      setBreadcrumbs(customBreadcrumbs);
    }
  }, [customBreadcrumbs, setBreadcrumbs]);
}

/**
 * Hook to add context-specific breadcrumbs (e.g., application name, document title)
 * This appends to existing breadcrumbs rather than replacing them
 */
export function useContextualBreadcrumb(item: BreadcrumbItem) {
  const { addBreadcrumb } = useNavigation();

  useEffect(() => {
    addBreadcrumb(item);
  }, [item, addBreadcrumb]);
}

/**
 * Hook that automatically sets up breadcrumbs based on current application and path
 * This should be called at the root level to set up automatic breadcrumbs
 */
export function useAutomaticBreadcrumbs(enabled: boolean = true) {
  const pathname = usePathname();
  const { setBreadcrumbs } = useNavigation();
  const { applicationData, loading, slug } = useApplication();

  useEffect(() => {
    if (!enabled || loading || !pathname) return;

    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    // Add application breadcrumb if we have application data
    if (applicationData) {
      breadcrumbs.push({
        label: applicationData.title || applicationData.name,
        href: `/${slug}`,
      });
    }

    // Add additional breadcrumb levels based on the current path
    const pathParts = pathname.split("/").filter(Boolean);
    if (pathParts.length > 1) {
      // Skip the first part (already added as application breadcrumb)
      for (let i = 1; i < pathParts.length; i++) {
        const pathSegment = pathParts[i];
        const breadcrumbPath = "/" + pathParts.slice(0, i + 1).join("/");

        breadcrumbs.push({
          label: pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1),
          href: breadcrumbPath,
        });
      }
    }

    setBreadcrumbs(breadcrumbs);
  }, [enabled, applicationData, pathname, slug, loading, setBreadcrumbs]);

  return { applicationData, loading, slug };
}
