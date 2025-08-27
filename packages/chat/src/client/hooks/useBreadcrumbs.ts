/**
 * Smart breadcrumbs for chat application
 * Handles thread-specific breadcrumbs with meaningful names
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface NavigationContextType {
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
}

export interface ChatThread {
  id: string;
  title?: string;
  name?: string;
  created_at?: string;
}

/**
 * Smart breadcrumbs hook for chat application
 * Automatically generates context-aware breadcrumbs based on the current path
 */
export function useBreadcrumbs(
  navigationContext?: NavigationContextType,
  chatApiClient?: {
    getThread: (threadId: string) => Promise<ChatThread>;
  },
  appData?: {
    title?: string;
    name: string;
    slug: string;
  }
) {
  const pathname = usePathname();
  const [threadData, setThreadData] = useState<ChatThread | null>(null);
  const [hash, setHash] = useState("");

  // Track hash changes
  useEffect(() => {
    const updateHash = () => {
      if (typeof window !== "undefined") {
        setHash(window.location.hash);
      }
    };

    // Initial hash
    updateHash();

    // Listen for hash changes
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", updateHash);
      return () => window.removeEventListener("hashchange", updateHash);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!pathname || !navigationContext) return;

    const generateBreadcrumbs = async () => {
      const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

      // Add application breadcrumb
      if (appData) {
        breadcrumbs.push({
          label: appData.title || appData.name,
          href: `/app/${appData.slug}`,
        });
      }

      // Parse the path for chat-specific routes
      const pathParts = pathname.split("/").filter(Boolean);

      // Handle chat application paths
      if (pathParts.includes("chat")) {
        // Handle thread-specific paths
        if (hash && hash.includes("thread")) {
          try {
            // Extract thread ID from hash
            const urlParams = new URLSearchParams(hash.replace("#thread?", ""));
            const threadId = urlParams.get("id");

            if (threadId && chatApiClient) {
              try {
                // Fetch thread data for smart naming
                const thread = await chatApiClient.getThread(threadId);
                setThreadData(thread);

                // Add thread-specific breadcrumb with smart naming
                const threadLabel = getThreadDisplayName(thread);
                breadcrumbs.push({
                  label: threadLabel,
                  href: `/chat#thread?id=${threadId}`,
                });
              } catch (error) {
                console.error("Failed to fetch thread data:", error);
                // Fallback to generic breadcrumb
                breadcrumbs.push({
                  label: `Thread ${threadId.slice(0, 8)}...`,
                  href: `/chat#thread?id=${threadId}`,
                });
              }
            }
          } catch (error) {
            console.error("Failed to parse thread hash:", error);
          }
        }
        // Handle other hash-based navigation within chat
        else if (hash) {
          const hashSegment = hash.replace("#", "");
          const smartLabel = getHashDisplayName(hashSegment);

          breadcrumbs.push({
            label: smartLabel,
            href: `/chat${hash}`,
          });
        }
      }

      navigationContext.setBreadcrumbs(breadcrumbs);
    };

    generateBreadcrumbs();
  }, [pathname, appData, navigationContext, hash, chatApiClient]);

  return { threadData, hash };
}

/**
 * Generate a smart display name for a thread
 */
function getThreadDisplayName(thread: ChatThread): string {
  if (thread.title) {
    return thread.title;
  }

  if (thread.name) {
    return thread.name;
  }

  // Fallback to truncated ID
  return `Thread ${thread.id.slice(0, 8)}...`;
}

/**
 * Generate a smart display name for hash segments
 */
function getHashDisplayName(hashSegment: string): string {
  const displayMap: Record<string, string> = {
    threads: "Threads",
    new: "New Thread",
    settings: "Settings",
    history: "History",
    templates: "Templates",
    models: "Models",
    agents: "Agents",
  };

  return (
    displayMap[hashSegment] ||
    hashSegment.charAt(0).toUpperCase() + hashSegment.slice(1)
  );
}
