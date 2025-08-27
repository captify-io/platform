import { useEffect, useState } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface ChatBreadcrumbsConfig {
  basePath: string;
  appName?: string;
  threadTitle?: string;
  threadId?: string;
  onBreadcrumbsChange?: (breadcrumbs: BreadcrumbItem[]) => void;
}

interface UseChatBreadcrumbsResult {
  breadcrumbs: BreadcrumbItem[];
  threadData: { id?: string; title?: string } | null;
}

export function useChatBreadcrumbs({
  basePath,
  appName = "Chat",
  threadTitle,
  threadId,
  onBreadcrumbsChange,
}: ChatBreadcrumbsConfig): UseChatBreadcrumbsResult {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [hash, setHash] = useState("");

  const threadData =
    threadId && threadTitle ? { id: threadId, title: threadTitle } : null;

  // Track hash changes if in browser environment
  useEffect(() => {
    if (typeof window === "undefined") return;

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
    const generateBreadcrumbs = (): BreadcrumbItem[] => {
      const items: BreadcrumbItem[] = [
        {
          label: appName,
          href: basePath,
          isActive: false,
        },
      ];

      // If we have thread data, add the thread breadcrumb
      if (threadData) {
        items.push({
          label: threadData.title || `Thread ${threadData.id.slice(0, 8)}`,
          isActive: true,
        });
      }

      return items;
    };

    const newBreadcrumbs = generateBreadcrumbs();
    setBreadcrumbs(newBreadcrumbs);
    onBreadcrumbsChange?.(newBreadcrumbs);
  }, [basePath, appName, threadData, onBreadcrumbsChange]);

  return {
    breadcrumbs,
    threadData,
  };
}
