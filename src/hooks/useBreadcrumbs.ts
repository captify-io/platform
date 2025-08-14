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
 * Uses smart patterns to avoid showing cryptic IDs and technical path segments
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

    // Parse path intelligently to avoid showing technical segments
    const pathParts = pathname.split("/").filter(Boolean);

    // Skip the first two parts if it's /app/[slug] pattern
    const startIndex = pathParts[0] === "app" ? 2 : 1;

    for (let i = startIndex; i < pathParts.length; i++) {
      const pathSegment = pathParts[i];
      const breadcrumbPath = "/" + pathParts.slice(0, i + 1).join("/");

      // Skip technical path segments that aren't user-friendly
      if (shouldSkipPathSegment(pathSegment)) {
        continue;
      }

      // Get a human-readable label for the segment
      const label = getSmartSegmentLabel(pathSegment);

      breadcrumbs.push({
        label,
        href: breadcrumbPath,
      });
    }

    setBreadcrumbs(breadcrumbs);
  }, [enabled, applicationData, pathname, slug, loading, setBreadcrumbs]);

  return { applicationData, loading, slug };
}

/**
 * Determines if a path segment should be skipped in breadcrumbs
 * Skips technical segments like UUIDs, single letters, etc.
 */
function shouldSkipPathSegment(segment: string): boolean {
  // Skip UUID-like strings
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment
    )
  ) {
    return true;
  }

  // Skip very short technical segments like "t", "id", etc.
  if (segment.length <= 2 && !isCommonShortWord(segment)) {
    return true;
  }

  // Skip numeric IDs
  if (/^\d+$/.test(segment)) {
    return true;
  }

  return false;
}

/**
 * Get a human-readable label for a path segment
 */
function getSmartSegmentLabel(segment: string): string {
  // Common mappings
  const labelMap: Record<string, string> = {
    settings: "Settings",
    history: "History",
    admin: "Admin",
    profile: "Profile",
    edit: "Edit",
    new: "New",
    create: "Create",
    view: "View",
    manage: "Manage",
    config: "Configuration",
    api: "API",
    docs: "Documentation",
    help: "Help",
    about: "About",
  };

  if (labelMap[segment.toLowerCase()]) {
    return labelMap[segment.toLowerCase()];
  }

  // Convert kebab-case and snake_case to Title Case
  const formatted = segment
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return formatted;
}

/**
 * Check if a short segment is a common word that should be included
 */
function isCommonShortWord(segment: string): boolean {
  const commonWords = [
    "me",
    "my",
    "go",
    "do",
    "be",
    "is",
    "it",
    "an",
    "as",
    "at",
    "by",
    "of",
    "on",
    "to",
    "up",
  ];
  return commonWords.includes(segment.toLowerCase());
}
