"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { useApplication } from "@/context/ApplicationContext";

interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  children?: MenuItem[];
}

export interface ApplicationInfo {
  id: string;
  name: string;
  menu: MenuItem[];
  agentId?: string;
  agentAliasId?: string;
}

interface AppMenuProps {
  applicationId: string;
  isVisible: boolean;
  onMenuLoad?: (hasMenu: boolean) => void;
  onApplicationLoad?: (applicationInfo: ApplicationInfo) => void;
  className?: string;
}

export function AppMenu({
  applicationId,
  isVisible,
  onMenuLoad,
  onApplicationLoad,
  className,
}: AppMenuProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [hasMenu, setHasMenu] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Get application data from context instead of fetching config file
  const { applicationData, loading } = useApplication();

  // Track hash changes for hash-based navigation
  useEffect(() => {
    const updateHash = () => {
      if (typeof window !== "undefined") {
        setCurrentHash(window.location.hash);
      }
    };

    // Set initial hash
    updateHash();

    // Listen for hash changes
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  useEffect(() => {
    if (!loading && applicationData) {
      // Use application data from context
      const menu = applicationData.menu || [];
      setMenuItems(menu);
      setHasMenu(menu.length > 0);
      onMenuLoad?.(menu.length > 0);

      // Convert to legacy format for backward compatibility
      const legacyAppInfo: ApplicationInfo = {
        id: applicationData.id,
        name: applicationData.name,
        menu: menu,
        agentId: applicationData.agentId,
        agentAliasId: applicationData.agentAliasId,
      };
      onApplicationLoad?.(legacyAppInfo);
    } else if (!loading) {
      // No application data available
      setMenuItems([]);
      setHasMenu(false);
      onMenuLoad?.(false);
    }
  }, [applicationData, loading, onMenuLoad, onApplicationLoad]);

  const handleMenuClick = (item: MenuItem) => {
    // Use hash-based navigation for all applications
    if (typeof window !== "undefined") {
      // Set hash to just the menu item id (e.g., #advanced-forecast, #workbench)
      window.location.hash = item.id;
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    // Determine if this menu item is active based on current hash
    let isActive = false;

    // Extract the base hash (before any query parameters)
    const baseHash = currentHash.split("?")[0];

    // Check if current hash matches this menu item's id
    const expectedHash = `#${item.id}`;
    isActive = baseHash === expectedHash;

    // If no hash is set, default to the first menu item (advanced-forecast for MI)
    if (currentHash === "" && item.id === "advanced-forecast") {
      isActive = true;
    }

    return (
      <div key={item.id}>
        <button
          onClick={() => handleMenuClick(item)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors text-left ${
            isActive
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {item.icon && <DynamicIcon name={item.icon} className="h-4 w-4" />}
          <span>{item.label}</span>
        </button>
        {item.children && item.children.length > 0 && (
          <div className="ml-4 space-y-1">
            {item.children.map(renderMenuItem)}
          </div>
        )}
      </div>
    );
  };

  // Show loading state if we're still loading
  if (loading) {
    return (
      <div className={`w-64 bg-sidebar border-r ${className}`}>
        <div className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if menu doesn't exist or is not visible from context
  if (!hasMenu || !isVisible) {
    return null;
  }

  return (
    <div
      className={`w-64 bg-sidebar border-r flex-shrink-0 h-full overflow-y-auto ${className}`}
    >
      <div className="p-4">
        <div className="space-y-1">{menuItems.map(renderMenuItem)}</div>
      </div>
    </div>
  );
}
