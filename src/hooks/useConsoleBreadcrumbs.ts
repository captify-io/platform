/**
 * Smart breadcrumbs for console application
 * Handles thread-specific breadcrumbs with meaningful names
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useNavigation, BreadcrumbItem } from "@/context/NavigationContext";
import { useApplication } from "@/context/ApplicationContext";
import { consoleApiClient } from "@/app/console/services/api-client";
import type { ChatThread } from "@/types/chat";

/**
 * Smart breadcrumbs hook for console application
 * Automatically generates context-aware breadcrumbs based on the current path
 */
export function useConsoleBreadcrumbs() {
  const pathname = usePathname();
  const { setBreadcrumbs } = useNavigation();
  const { applicationData, loading } = useApplication();
  const [threadData, setThreadData] = useState<ChatThread | null>(null);
  const [hash, setHash] = useState("");

  // Track hash changes
  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash);
    };

    // Initial hash
    updateHash();

    // Listen for hash changes
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  useEffect(() => {
    if (loading || !pathname) return;

    const generateBreadcrumbs = async () => {
      const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

      // Add application breadcrumb
      if (applicationData) {
        breadcrumbs.push({
          label: applicationData.title || applicationData.name,
          href: `/app/${applicationData.slug}`,
        });
      }

      // Check for hash-based thread navigation
      if (hash.startsWith("#thread?")) {
        const urlParams = new URLSearchParams(hash.replace("#thread?", ""));
        const threadId = urlParams.get("id");

        if (threadId) {
          try {
            // Try to fetch thread data to get the actual title
            const threadsResponse = await consoleApiClient.getThreads();
            const thread = threadsResponse.threads?.find(
              (t) => t.id === threadId
            );

            if (thread) {
              setThreadData(thread);
              breadcrumbs.push({
                label: thread.title || "Chat Thread",
                href: `/app/console#thread?id=${threadId}`,
              });
            } else {
              // Fallback if thread not found
              breadcrumbs.push({
                label: "Chat Thread",
                href: `/app/console#thread?id=${threadId}`,
              });
            }
          } catch (error) {
            console.warn("Failed to fetch thread data for breadcrumbs:", error);
            // Fallback breadcrumb
            breadcrumbs.push({
              label: "Chat Thread",
              href: `/app/console#thread?id=${threadId}`,
            });
          }
        }
      }

      // Handle regular path-based navigation for other console sub-pages
      const pathParts = pathname.split("/").filter(Boolean);
      if (
        pathParts.length >= 3 &&
        pathParts[0] === "app" &&
        pathParts[1] === "console"
      ) {
        // Handle other console sub-paths
        for (let i = 2; i < pathParts.length; i++) {
          const segment = pathParts[i];
          const breadcrumbPath = "/" + pathParts.slice(0, i + 1).join("/");

          // Convert path segments to readable labels
          const label = getReadableLabel(segment);
          breadcrumbs.push({
            label,
            href: breadcrumbPath,
          });
        }
      }

      setBreadcrumbs(breadcrumbs);
    };

    generateBreadcrumbs();
  }, [pathname, applicationData, loading, setBreadcrumbs, hash]);

  return { threadData };
}

/**
 * Convert path segments to human-readable labels
 */
function getReadableLabel(segment: string): string {
  const labelMap: Record<string, string> = {
    history: "Thread History",
    settings: "Settings",
    agents: "Agents",
    tools: "Tools",
    t: "Thread", // This shouldn't appear due to special handling above
  };

  return (
    labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
  );
}
