/**
 * Three-Panel AppLayout Component
 * [menu][content][agent] layout for package applications
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { cn } from "../lib/utils";
import { usePackageContext } from "../context/PackageContext";
import { PackageContentPanel } from "./PackageContentPanel";
import { PackageAgentPanel } from "./PackageAgentPanel";
import { Button } from "./ui/button";
import { ChevronRight, ChevronLeft, Bot, ChevronDown } from "lucide-react";
import { DynamicIcon } from "./ui/dynamic-icon";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { useRouter } from "next/navigation";
import { useApi } from "../hooks/useApi";

interface ThreePanelLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

interface MenuItem {
  icon: string;
  id: string;
  label: string;
  href: string;
  order: number;
  children?: MenuItem[];
}

interface AppData {
  app: string;
  menu: MenuItem[];
  version: string;
  icon: string;
  status: string;
  visibility: string;
  slug: string;
  name: string;
  description: string;
  id: string;
}

// Inner component that has access to SidebarProvider context
function ThreePanelContent({ children, className }: ThreePanelLayoutProps) {
  const { packageState, toggleAgentPanel, setAgentWidth, packageConfig } =
    usePackageContext();
  const [isResizingAgent, setIsResizingAgent] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const { toggleSidebar, state } = useSidebar();
  const [appData, setAppData] = useState<AppData | null>(null);
  const [currentHash, setCurrentHash] = useState<string>(() => {
    // Initialize with current hash from URL, fallback to "home"
    if (typeof window !== "undefined") {
      const initialHash = window.location.hash.slice(1) || "home";
      return initialHash;
    }
    return "home";
  });
  const router = useRouter();

  // API hook for fetching app data
  const { data: apiData, loading, error, execute: fetchAppData } = useApi(
    async (client, appSlug: string) => {
      return client.get({
        table: "App",
        FilterExpression: "slug = :slug",
        ExpressionAttributeValues: {
          ":slug": appSlug,
        },
      });
    }
  );

  // Monitor hash changes
  useEffect(() => {
    const updateHash = () => {
      const hash = window.location.hash.slice(1) || "home";
      // Update state with new hash (React will handle the comparison)
      setCurrentHash((prevHash) => {
        if (hash !== prevHash) {
          return hash;
        } else {
          return prevHash;
        }
      });
    };

    // Set initial hash
    updateHash();

    // Listen for hash changes
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, []); // Empty dependency array is correct now since we use functional setState

  // Track when currentHash state changes
  useEffect(() => {}, [currentHash]);

  // Load app data when packageConfig changes
  useEffect(() => {
    if (packageConfig?.slug && typeof window !== "undefined") {
      fetchAppData(packageConfig.slug);
    }
  }, [packageConfig?.slug, fetchAppData]);

  // Update appData when API data changes
  useEffect(() => {
    if (apiData && apiData.Items && apiData.Items.length > 0) {
      const app = apiData.Items[0] as AppData;
      setAppData(app);
    } else {
      setAppData(null);
    }
  }, [apiData]);

  // Handle navigation
  const handleNavigation = (route: string) => {
    // Get the current app slug from packageConfig, fallback to "core"
    const appSlug = packageConfig?.slug || "core";

    // Extract the route ID from the route string
    // Routes can be "/policies/ssp", "/access/users", etc.
    // We need to convert them to route IDs for the PackagePageRouter
    let routeId;

    if (route === "/") {
      routeId = "home";
    } else {
      routeId = route.substring(1).replace(/\//g, "-");
    }

    // Check if we're already on the correct path, if not navigate to it first
    const currentPath = window.location.pathname;
    const targetPath = `/${appSlug}`;

    if (currentPath !== targetPath) {
      router.push(`${targetPath}#${routeId}`);
    } else {
      // We're on the right page, just update the hash
      window.location.hash = routeId;

      // Manually trigger hashchange event since programmatic hash changes don't always fire it
      const hashChangeEvent = new HashChangeEvent("hashchange", {
        oldURL: window.location.href,
        newURL: window.location.href,
      });
      window.dispatchEvent(hashChangeEvent);
    }
  };

  // Handle sidebar resize drag
  const handleSidebarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizingSidebar(true);

      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(200, Math.min(600, startWidth + deltaX));
        setSidebarWidth(newWidth);
      };

      const handleMouseUp = () => {
        setIsResizingSidebar(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [sidebarWidth]
  );

  // Handle agent panel resize drag
  const handleAgentMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizingAgent(true);

      const startX = e.clientX;
      const startWidth = packageState.agentWidth || 320;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = startX - e.clientX;
        const newWidth = Math.max(250, Math.min(600, startWidth + deltaX));
        setAgentWidth(newWidth);
      };

      const handleMouseUp = () => {
        setIsResizingAgent(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [packageState.agentWidth, setAgentWidth]
  );

  return (
    <div className={cn("flex h-full w-full overflow-hidden", className)}>
      {/* Menu Sidebar */}
      <div className="flex relative">
        <Sidebar
          collapsible="offcanvas"
          className="relative overflow-hidden"
          style={{ width: state === "collapsed" ? 0 : sidebarWidth }}
        >
          <SidebarContent className="px-2 py-4 overflow-hidden flex min-h-0 flex-1 flex-col gap-2">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">
                Loading menu...
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-muted-foreground">
                Error loading menu: {error}
              </div>
            ) : appData && appData.menu ? (
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {appData.menu
                      .sort((a, b) => a.order - b.order)
                      .map((menuItem) => {
                        // Check if menu item has children (collapsible) or is a direct button
                        const hasChildren =
                          menuItem.children && menuItem.children.length > 0;

                        if (hasChildren) {
                          // Complex structure: Collapsible section with sub-items
                          return (
                            <Collapsible
                              key={menuItem.id}
                              defaultOpen={true}
                              className="group/collapsible"
                            >
                              <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <DynamicIcon
                                        name={menuItem.icon}
                                        className="h-4 w-4 flex-shrink-0"
                                      />
                                      <span className="truncate">
                                        {menuItem.label}
                                      </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub>
                                    {menuItem.children!
                                      .sort((a, b) => a.order - b.order)
                                      .map((child) => (
                                        <SidebarMenuSubItem key={child.id}>
                                          <SidebarMenuSubButton
                                            onClick={() =>
                                              handleNavigation(child.href)
                                            }
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <DynamicIcon
                                                name={child.icon}
                                                className="h-4 w-4 flex-shrink-0"
                                              />
                                              <span className="truncate">
                                                {child.label}
                                              </span>
                                            </div>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                      ))}
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </SidebarMenuItem>
                            </Collapsible>
                          );
                        } else {
                          // Simple structure: Direct button for menu items without children
                          return (
                            <SidebarMenuItem key={menuItem.id}>
                              <SidebarMenuButton
                                onClick={() =>
                                  handleNavigation(menuItem.href)
                                }
                                className="flex items-center gap-2 w-full"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <DynamicIcon
                                    name={menuItem.icon}
                                    className="h-4 w-4 flex-shrink-0"
                                  />
                                  <span className="truncate">
                                    {menuItem.label}
                                  </span>
                                </div>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        }
                      })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                No menu data available
              </div>
            )}
          </SidebarContent>
        </Sidebar>

        {/* Sidebar Resize Handle */}
        {state !== "collapsed" && (
          <div
            className={cn(
              "w-1 bg-transparent hover:bg-border cursor-col-resize transition-colors relative",
              isResizingSidebar && "bg-border"
            )}
            onMouseDown={handleSidebarMouseDown}
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-border opacity-0 hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Content Panel with SidebarInset */}
        <SidebarInset className="flex-1 overflow-hidden relative">
          <PackageContentPanel currentHash={currentHash}>
            {children}
          </PackageContentPanel>
        </SidebarInset>

        {/* Agent Panel */}
        <div
          className={cn(
            "flex-shrink-0 transition-all duration-300 bg-background relative border-l",
            !packageState.agentPanelOpen && "w-0"
          )}
          style={{
            width: packageState.agentPanelOpen
              ? packageState.agentWidth || 320
              : 0,
          }}
        >
          {packageState.agentPanelOpen && (
            <div className="flex h-full">
              {/* Agent Resize Handle */}
              <div
                className={cn(
                  "w-0.5 bg-border hover:bg-accent cursor-col-resize transition-colors",
                  isResizingAgent && "bg-accent"
                )}
                onMouseDown={handleAgentMouseDown}
              />

              <div className="flex-1 overflow-hidden">
                <PackageAgentPanel />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Buttons - both positioned at the same container level */}
      {/* Sidebar Toggle Button */}
      {state !== "collapsed" ? (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 rounded-full shadow-lg bg-background border-2 border-border hover:bg-accent z-[200]"
          onClick={toggleSidebar}
          style={{
            left: `${sidebarWidth - 24}px`, // Center on the border (button is 48px wide, so -24px to center)
          }}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="fixed left-4 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 rounded-full shadow-lg bg-background border-2 border-border hover:bg-accent z-[200]"
          onClick={toggleSidebar}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      {/* Agent Toggle Button - positioned relative to the content area */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 rounded-full shadow-lg bg-background border-2 border-border hover:bg-accent z-[200]"
        onClick={toggleAgentPanel}
        style={{
          right: packageState.agentPanelOpen
            ? `${(packageState.agentWidth || 320) - 24}px`
            : "16px",
        }}
      >
        {packageState.agentPanelOpen ? (
          <ChevronRight className="h-6 w-6" />
        ) : (
          <Bot className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}

export function ThreePanelLayout({
  children,
  className,
}: ThreePanelLayoutProps) {
  return (
    <SidebarProvider>
      <ThreePanelContent className={className}>{children}</ThreePanelContent>
    </SidebarProvider>
  );
}
