"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useCaptify } from "../context/CaptifyContext";
import { cn } from "../lib/utils";
import { ResizableChatPanel } from "./ChatLayout";
import {
  SidebarProvider,
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
  SidebarInset,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import { Bot } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import type { MenuItem } from "../context/CaptifyContext";

interface AppLayoutProps {
  children: ReactNode;
  applicationId?: string;
  showMenu?: boolean;
  showChat?: boolean;
  className?: string;
}

/**
 * AppLayout with integrated menu using shadcn sidebar pattern
 * Automatically detects app from URL and manages sidebar state
 */
export function AppLayout({
  children,
  applicationId,
  showMenu = true,
  showChat = false,
  className = "",
}: AppLayoutProps) {
  const { currentApp, hasMenu, isSidebarOpen, setIsSidebarOpen } = useCaptify();
  const [isChatOpen, setIsChatOpen] = useState(true);

  console.log("AppLayout - context values:", {
    currentApp,
    hasMenu,
    isSidebarOpen,
  });

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

  // Use currentApp from context or fallback to applicationId prop
  const appToUse =
    currentApp ||
    (applicationId
      ? { id: applicationId, name: applicationId, menu: [], config: {} }
      : null);

  if (!appToUse) {
    // No app detected, render children without layout
    return <div className={className}>{children}</div>;
  }

  const shouldShowMenu = showMenu && hasMenu;

  // Convert ApplicationMenuItem[] to MenuItem[] if needed
  const menuItems =
    currentApp?.menu ||
    currentApp?.menuItems?.map(
      (item): MenuItem => ({
        id: item.menu_item_id,
        name: item.icon,
        label: item.label,
        icon: item.icon,
        href: item.href,
        order: item.order,
        parentId: item.parent_id,
        isActive: false,
      })
    ) ||
    [];

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
            <DynamicIcon name={(item.icon as IconName) || "menu"} />
            <span>{item.label}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const AppSidebar = () => (
    <Sidebar variant="sidebar" className="h-full">
      <SidebarContent className="h-full">
        <SidebarGroup className="h-full">
          <SidebarGroupContent className="h-full overflow-auto">
            <SidebarMenu>
              {menuItems.map((item: MenuItem) => renderMenuItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

  return (
    <div className="h-full flex">
      {/* Custom Sidebar - Non-fixed positioning */}
      {isSidebarOpen && shouldShowMenu && (
        <div className="w-64 flex-shrink-0 bg-sidebar border-r border-border">
          <div className="h-full overflow-auto p-2">
            <div className="space-y-1">
              {menuItems.map((item: MenuItem) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = item.id;
                  }}
                >
                  <DynamicIcon
                    name={(item.icon as IconName) || "menu"}
                    className="h-4 w-4"
                  />
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0">{children}</div>
      </div>

      {/* Chat Panel */}
      {showChat && isChatOpen && (
        <ResizableChatPanel
          applicationName={appToUse.name}
          agentId={currentApp?.agentId}
          agentAliasId={currentApp?.agentAliasId}
          isCollapsible={false}
          isSliding={false}
          isOpen={true}
          showSessionControls={true}
          showCloseButton={true}
          onClose={() => setIsChatOpen(false)}
          welcomeMessage={`Welcome to ${appToUse.name}! How can I help you today?`}
          placeholder="Type your message..."
          minWidth={280}
          maxWidth={600}
          defaultWidth={320}
          className="h-full border-l border-border"
        />
      )}

      {/* Floating Bot Button - appears when chat is closed */}
      {showChat && !isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          title="Open Chat"
        >
          <Bot className="h-6 w-6 text-primary-foreground" />
        </Button>
      )}
    </div>
  );
}
