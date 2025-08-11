import { useState, useEffect, useCallback } from "react";
import { ApplicationMenuItem, MenuItemsResponse } from "@/types/database";
import { api } from "@/lib/api-client";

export function useAppMenuItems(appId: string) {
  const [menuItems, setMenuItems] = useState<ApplicationMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = useCallback(async () => {
    if (!appId) return; // Prevent fetch if no appId

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<MenuItemsResponse>(
        `/api/apps/menu-items?app_id=${appId}`
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to fetch menu items");
      }

      if (response.data) {
        setMenuItems(response.data.menu_items);
      } else {
        setMenuItems([]);
      }
    } catch (err) {
      console.error("Error fetching menu items:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch menu items"
      );
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  const createMenuItem = async (
    menuItem: Omit<
      ApplicationMenuItem,
      "app_id" | "menu_item_id" | "created_at" | "updated_at" | "created_by"
    >
  ) => {
    try {
      const response = await api.post<ApplicationMenuItem>(
        "/api/apps/menu-items",
        {
          ...menuItem,
          app_id: appId,
        }
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to create menu item");
      }

      if (response.data) {
        setMenuItems((prev) =>
          [...prev, response.data!].sort((a, b) => a.order - b.order)
        );
        return response.data;
      }

      throw new Error("No data returned from create menu item");
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to create menu item"
      );
    }
  };

  const updateMenuItem = async (
    menuItemId: string,
    updates: Partial<ApplicationMenuItem>
  ) => {
    try {
      const response = await api.put<ApplicationMenuItem>(
        `/api/apps/menu-items?app_id=${appId}&menu_item_id=${menuItemId}`,
        updates
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to update menu item");
      }

      if (response.data) {
        setMenuItems((prev) =>
          prev
            .map((item) =>
              item.menu_item_id === menuItemId ? response.data! : item
            )
            .sort((a, b) => a.order - b.order)
        );
        return response.data;
      }

      throw new Error("No data returned from update menu item");
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to update menu item"
      );
    }
  };

  const deleteMenuItem = async (menuItemId: string) => {
    try {
      const response = await api.delete(
        `/api/apps/menu-items?app_id=${appId}&menu_item_id=${menuItemId}`
      );

      if (!response.ok) {
        throw new Error(response.error || "Failed to delete menu item");
      }

      setMenuItems((prev) =>
        prev.filter((item) => item.menu_item_id !== menuItemId)
      );
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to delete menu item"
      );
    }
  };

  useEffect(() => {
    if (appId) {
      fetchMenuItems();
    }
  }, [fetchMenuItems, appId]);

  return {
    menuItems,
    loading,
    error,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    refreshMenuItems: fetchMenuItems,
  };
}
