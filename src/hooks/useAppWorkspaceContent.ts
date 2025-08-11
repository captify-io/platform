import { useState, useEffect, useCallback } from "react";
import {
  ApplicationWorkspaceContent,
  WorkspaceContentResponse,
} from "@/types/database";
import { api } from "@/lib/api-client";

export function useAppWorkspaceContent(appId: string, menuItemId?: string) {
  const [workspaceContent, setWorkspaceContent] = useState<
    ApplicationWorkspaceContent[]
  >([]);
  const [allWorkspaceContent, setAllWorkspaceContent] = useState<
    ApplicationWorkspaceContent[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaceContent = useCallback(async () => {
    if (!appId) return; // Prevent fetch if no appId

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<WorkspaceContentResponse>(
        `/api/apps/workspace-content?app_id=${appId}`
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to fetch workspace content");
      }

      if (response.data) {
        const allContent = response.data.workspace_content;
        setAllWorkspaceContent(allContent);

        // Filter content based on menu item if provided
        if (menuItemId) {
          const filteredContent = allContent.filter((content) => {
            // Direct relationship via menu_item_id field
            // Handle legacy content that might not have menu_item_id yet
            const contentMenuItemId = content.menu_item_id;
            if (contentMenuItemId) {
              return contentMenuItemId === menuItemId;
            }

            // Fallback: try to match based on content_id patterns for legacy content
            console.log(
              `⚠️ Content ${content.content_id} missing menu_item_id, using fallback matching`
            );
            return (
              content.content_id === menuItemId ||
              content.content_id.startsWith(`${menuItemId}-`) ||
              content.content_id.includes(menuItemId)
            );
          });
          setWorkspaceContent(filteredContent);
          console.log(
            `🔍 Filtered to ${filteredContent.length} items for menu item: ${menuItemId}`
          );
        } else {
          setWorkspaceContent(allContent);
        }
      } else {
        setWorkspaceContent([]);
        setAllWorkspaceContent([]);
      }
    } catch (err) {
      console.error("Error fetching workspace content:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch workspace content"
      );
      setWorkspaceContent([]);
      setAllWorkspaceContent([]);
    } finally {
      setLoading(false);
    }
  }, [appId, menuItemId]);

  // Re-filter content when menuItemId changes
  useEffect(() => {
    if (allWorkspaceContent.length > 0) {
      if (menuItemId) {
        const filteredContent = allWorkspaceContent.filter((content) => {
          // Direct relationship via menu_item_id field
          // Handle legacy content that might not have menu_item_id yet
          const contentMenuItemId = content.menu_item_id;
          if (contentMenuItemId) {
            return contentMenuItemId === menuItemId;
          }

          // Fallback: try to match based on content_id patterns for legacy content
          console.log(
            `⚠️ Content ${content.content_id} missing menu_item_id, using fallback matching`
          );
          return (
            content.content_id === menuItemId ||
            content.content_id.startsWith(`${menuItemId}-`) ||
            content.content_id.includes(menuItemId)
          );
        });
        setWorkspaceContent(filteredContent);
        console.log(
          `🔍 Filtered to ${filteredContent.length} items for menu item: ${menuItemId}`
        );
      } else {
        setWorkspaceContent(allWorkspaceContent);
      }
    }
  }, [menuItemId, allWorkspaceContent]);

  const createWorkspaceContent = async (
    content: Omit<
      ApplicationWorkspaceContent,
      | "app_id"
      | "content_id"
      | "version"
      | "created_at"
      | "updated_at"
      | "created_by"
    >
  ) => {
    try {
      const response = await api.post<ApplicationWorkspaceContent>(
        "/api/apps/workspace-content",
        {
          ...content,
          app_id: appId,
        }
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to create workspace content");
      }

      if (response.data) {
        setWorkspaceContent((prev) => [...prev, response.data!]);
        return response.data;
      }

      throw new Error("No data returned from create workspace content");
    } catch (err) {
      throw new Error(
        err instanceof Error
          ? err.message
          : "Failed to create workspace content"
      );
    }
  };

  const updateWorkspaceContent = async (
    contentId: string,
    updates: Partial<ApplicationWorkspaceContent>,
    updatedBy: string
  ) => {
    try {
      const response = await api.put<ApplicationWorkspaceContent>(
        `/api/apps/workspace-content?app_id=${appId}&content_id=${contentId}&updated_by=${updatedBy}`,
        updates
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to update workspace content");
      }

      if (response.data) {
        const updatedContent = allWorkspaceContent.map((item) =>
          item.content_id === contentId ? response.data! : item
        );
        setAllWorkspaceContent(updatedContent);

        // Re-apply current filter
        if (menuItemId) {
          const filteredContent = updatedContent.filter((content) => {
            // Direct relationship via menu_item_id field
            // Handle legacy content that might not have menu_item_id yet
            const contentMenuItemId = content.menu_item_id;
            if (contentMenuItemId) {
              return contentMenuItemId === menuItemId;
            }

            // Fallback for legacy content
            return (
              content.content_id === menuItemId ||
              content.content_id.startsWith(`${menuItemId}-`) ||
              content.content_id.includes(menuItemId)
            );
          });
          setWorkspaceContent(filteredContent);
        } else {
          setWorkspaceContent(updatedContent);
        }

        return response.data;
      }

      throw new Error("No data returned from update workspace content");
    } catch (err) {
      throw new Error(
        err instanceof Error
          ? err.message
          : "Failed to update workspace content"
      );
    }
  };

  const deleteWorkspaceContent = async (contentId: string) => {
    try {
      const response = await api.delete(
        `/api/apps/workspace-content?app_id=${appId}&content_id=${contentId}`
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to delete workspace content");
      }

      setWorkspaceContent((prev) =>
        prev.filter((item) => item.content_id !== contentId)
      );
      setAllWorkspaceContent((prev) =>
        prev.filter((item) => item.content_id !== contentId)
      );
    } catch (err) {
      throw new Error(
        err instanceof Error
          ? err.message
          : "Failed to delete workspace content"
      );
    }
  };

  // Helper function to get content by type
  const getContentByType = (
    contentType: ApplicationWorkspaceContent["content_type"]
  ) => {
    return workspaceContent.filter((item) => item.content_type === contentType);
  };

  // Helper function to get sorted content for display
  const getSortedContent = () => {
    return [...workspaceContent].sort((a, b) => {
      // Handle enhanced content structure (no layout_config.position)
      if (!a.layout_config?.position || !b.layout_config?.position) {
        // For enhanced content, sort by created_at or updated_at timestamp
        const aTime = new Date(a.updated_at || a.created_at || "").getTime();
        const bTime = new Date(b.updated_at || b.created_at || "").getTime();
        return aTime - bTime;
      }

      // Sort legacy content by layout position: row first, then column
      const rowDiff =
        a.layout_config.position.row - b.layout_config.position.row;
      if (rowDiff !== 0) return rowDiff;
      return a.layout_config.position.col - b.layout_config.position.col;
    });
  };

  useEffect(() => {
    if (appId) {
      fetchWorkspaceContent();
    }
  }, [fetchWorkspaceContent, appId]);

  return {
    workspaceContent,
    loading,
    error,
    createWorkspaceContent,
    updateWorkspaceContent,
    deleteWorkspaceContent,
    refreshWorkspaceContent: fetchWorkspaceContent,
    getContentByType,
    getSortedContent,
  };
}
