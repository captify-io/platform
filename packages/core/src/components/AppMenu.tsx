"use client";

import { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from "./ui/sidebar";
import { useCaptify } from "../context/CaptifyContext";
import { cn } from "../lib/utils";
import type { MenuItem } from "../context/CaptifyContext";
import type { ApplicationMenuItem } from "../types";

interface AppMenuProps {
  appId: string;
  className?: string;
}

export function AppMenu({ appId, className }: AppMenuProps) {
  const { currentApp, isLoading, isSidebarOpen } = useCaptify();

  // Track hash changes for hash-based navigation
  useEffect(() => {
    const updateHash = () => {
      if (typeof window !== "undefined") {
        // Handle hash changes for menu navigation
        const hash = window.location.hash;
        // Menu navigation logic can be added here
      }
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton asChild>
            <span
              className={cn("flex items-center gap-2", level > 0 && "ml-4")}
            >
              {item.icon && <span className="text-sm">{item.icon}</span>}
              <span>{item.label}</span>
            </span>
          </SidebarMenuButton>
          <SidebarMenuSub>
            {item.children?.map((child) => (
              <SidebarMenuSubItem key={child.id}>
                <SidebarMenuSubButton asChild>
                  <a
                    href={`#${child.id}`}
                    className="flex items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.hash = child.id;
                    }}
                  >
                    {child.icon && (
                      <span className="text-sm">{child.icon}</span>
                    )}
                    <span>{child.label}</span>
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton asChild>
          <a
            href={`#${item.id}`}
            className={cn("flex items-center gap-2", level > 0 && "ml-4")}
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = item.id;
            }}
          >
            {item.icon && <span className="text-sm">{item.icon}</span>}
            <span>{item.label}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  if (isLoading) {
    return (
      <div className={cn("w-64 border-r bg-background", className)}>
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

  if (
    !currentApp ||
    (!currentApp.menu && !currentApp.menuItems) ||
    (currentApp.menu && currentApp.menu.length === 0) ||
    (currentApp.menuItems && currentApp.menuItems.length === 0)
  ) {
    return null;
  }

  // Convert ApplicationMenuItem[] to MenuItem[] if needed
  const menuItems =
    currentApp.menu ||
    currentApp.menuItems?.map(
      (item): MenuItem => ({
        id: item.menu_item_id,
        label: item.label,
        icon: item.icon,
        href: item.href,
        order: item.order,
        parentId: item.parent_id,
        isActive: false,
      })
    ) ||
    [];

  return (
    <SidebarProvider defaultOpen={isSidebarOpen}>
      <Sidebar className={cn("w-64 border-r", className)}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item: MenuItem) => renderMenuItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
