/**
 * Three-Panel AppLayout Component
 * [menu][content][agent] layout for package applications
 */

"use client";

import React, { useCallback, useEffect } from "react";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { PackageContentPanel } from "../packages/PackageContentPanel";
import { PackageAgentPanel } from "../packages/PackageAgentPanel";
import { Button } from "../ui/button";
import {
  ChevronRight,
  ChevronLeft,
  Bot,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
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
  SidebarTrigger,
  useSidebar,
} from "../ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { useRouter, usePathname } from "next/navigation";
import { useApi, useAppContext } from "../../hooks";
import { useCaptify } from "../providers/CaptifyProvider";
import { apiClient } from "../../lib/utils";
import type { AppData, ThreePanelLayoutProps } from "../../types";

// Dynamic import for pmbook config
const loadPmbookConfig = async () => {
  try {
    const { config } = await import("@captify-io/pmbook");
    return config;
  } catch (error) {
    console.error("Failed to load pmbook config:", error);
    return null;
  }
};

// Inner component that has access to SidebarProvider context
const ThreePanelContent = React.memo(function ThreePanelContent({
  children,
  className,
  packageSource,
}: ThreePanelLayoutProps) {
  const { session } = useCaptify(); // Use our custom hook
  const { setCurrentApp } = useAppContext(); // Get setCurrentApp from context
  const [isResizingAgent, setIsResizingAgent] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [agentWidth, setLocalAgentWidth] = useState(320);
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
  const pathname = usePathname();

  // Extract package slug from URL
  const packageSlug = pathname ? pathname.split("/").filter(Boolean)[0] : null;

  // Local agent panel functions
  const handleToggleAgentPanel = () => {
    setAgentPanelOpen(!agentPanelOpen);
  };

  const handleSetAgentWidth = useCallback((width: number) => {
    setLocalAgentWidth(width);
  }, []);

  // API hook for fetching app data - use query with slug-order-index
  const {
    data: apiData,
    loading,
    error,
    execute: fetchAppData,
  } = useApi(async (client, appSlug: string) => {
    return client.run({
      service: "dynamo",
      operation: "query",
      app: "core",
      table: "App",
      data: {
        IndexName: "slug-order-index",
        KeyConditionExpression: "slug = :slug",
        ExpressionAttributeValues: {
          ":slug": appSlug,
        },
        Limit: 1,
      },
    });
  });

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

  // Load app data when packageSlug changes
  useEffect(() => {
    if (packageSlug && typeof window !== "undefined") {
      if (packageSlug === "pmbook") {
        // For pmbook, load config from the package itself
        loadPmbookConfig().then((pmbookConfig) => {
          if (pmbookConfig) {
            // Transform pmbook config to AppData format
            const transformedAppData: AppData = {
              app: pmbookConfig.slug,
              menu: pmbookConfig.menu.map((item: any) => ({
                id: item.id,
                label: item.label,
                icon: item.icon,
                href: item.children ? "/" : item.href || `/${item.id}`,
                order: item.order,
                children: item.children?.map((child: any) => ({
                  id: child.id,
                  label: child.label,
                  icon: child.icon,
                  href: child.href,
                  order: child.order || 0,
                })),
              })),
              version: pmbookConfig.version,
              icon: "BookOpen",
              status: "active",
              visibility: "public",
              slug: pmbookConfig.slug,
              name: pmbookConfig.appName,
              description: pmbookConfig.description,
              id: pmbookConfig.slug,
              agentId: pmbookConfig.agentId,
              agentAliasId: pmbookConfig.agentAliasId,
              identityPoolId: pmbookConfig.identityPoolId,
            };
            setAppData(transformedAppData);

            // Set the app in the context
            if (setCurrentApp) {
              setCurrentApp(transformedAppData as any);
            }

            // Set the identity pool
            if (pmbookConfig.identityPoolId) {
              apiClient.setAppIdentityPool(pmbookConfig.identityPoolId, pmbookConfig.slug);
              console.log(
                `[ThreePanelLayout] Updated identity pool from pmbook config:`,
                pmbookConfig.identityPoolId
              );
            }
          }
        });
      } else {
        // For other packages, fetch from database
        fetchAppData(packageSlug);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageSlug]);

  // Update appData when API data changes
  useEffect(() => {
    if (apiData && apiData.Items && apiData.Items.length > 0) {
      const app = apiData.Items[0] as AppData;
      setAppData(app);

      // Set the app in the context so it can be used throughout the app
      if (setCurrentApp && app) {
        setCurrentApp(app as any);
      }

      // Set the identity pool in the API client so all API calls use it automatically
      if (app.identityPoolId) {
        apiClient.setAppIdentityPool(app.identityPoolId, app.slug);
        console.log(
          `[ThreePanelLayout] Updated identity pool from DB for ${app.slug}:`,
          app.identityPoolId
        );
      }
    } else {
      setAppData(null);
      // Don't clear the identity pool here - let ClientCaptifyLayout handle it
    }
  }, [apiData, setCurrentApp]);

  // Handle navigation
  const handleNavigation = (id: string) => {
    // Use the packageSlug from URL, with fallback to "core"
    const appSlug = packageSlug || "core";

    // Use the id directly as the route
    const routeId = id;

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
      const startWidth = agentWidth || 320;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = startX - e.clientX;
        const newWidth = Math.max(250, Math.min(600, startWidth + deltaX));
        setLocalAgentWidth(newWidth);
        handleSetAgentWidth(newWidth); // Use local handler
      };

      const handleMouseUp = () => {
        setIsResizingAgent(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [agentWidth, handleSetAgentWidth]
  );

  return (
    <div className={cn("flex h-full w-full overflow-hidden", className)}>
      {/* Menu Sidebar */}
      <div className="flex relative">
        <Sidebar
          collapsible="icon"
          className="relative"
          style={{ width: state === "collapsed" ? "3rem" : sidebarWidth }}
        >
          <SidebarContent
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden",
              state === "collapsed" ? "px-0" : "px-2"
            )}
          >
            {/* Top controls - always visible */}
            <div
              className={cn(
                "flex items-center gap-1 border-b border-border pb-2 pt-2",
                state === "collapsed" ? "flex-col px-0" : "flex-row px-0"
              )}
            >
              <SidebarTrigger
                className={cn("h-8 w-8", state === "collapsed" && "mb-1")}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/")}
                      className="h-8 w-8 p-0"
                    >
                      <Bot className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side={state === "collapsed" ? "right" : "bottom"}
                  >
                    Home
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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
                          // When collapsed, show child items directly (skip the header)
                          if (state === "collapsed") {
                            // Return child items as direct menu items when collapsed
                            return menuItem
                              .children!.sort((a, b) => a.order - b.order)
                              .map((child) => {
                                const childButton = (
                                  <SidebarMenuButton
                                    onClick={() => handleNavigation(child.id)}
                                    className="flex items-center justify-center w-full h-10 p-0"
                                  >
                                    <DynamicIcon
                                      name={child.icon || 'Circle'}
                                      className="h-4 w-4 shrink-0"
                                    />
                                  </SidebarMenuButton>
                                );

                                return (
                                  <SidebarMenuItem key={child.id}>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          {childButton}
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                          {child.label}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </SidebarMenuItem>
                                );
                              });
                          }

                          // When expanded, show collapsible section with sub-items
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
                                        name={menuItem.icon || 'Circle'}
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
                                    {menuItem
                                      .children!.sort(
                                        (a, b) => a.order - b.order
                                      )
                                      .map((child) => (
                                        <SidebarMenuSubItem key={child.id}>
                                          <SidebarMenuSubButton
                                            onClick={() =>
                                              handleNavigation(child.id)
                                            }
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <DynamicIcon
                                                name={child.icon || 'Circle'}
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
                          const menuButton = (
                            <SidebarMenuButton
                              onClick={() => handleNavigation(menuItem.id)}
                              className={cn(
                                "flex items-center w-full",
                                state === "collapsed"
                                  ? "justify-center h-10 p-0"
                                  : "gap-2"
                              )}
                            >
                              <DynamicIcon
                                name={menuItem.icon || 'Circle'}
                                className="h-4 w-4 shrink-0"
                              />
                              {state !== "collapsed" && (
                                <span className="truncate">
                                  {menuItem.label}
                                </span>
                              )}
                            </SidebarMenuButton>
                          );

                          return (
                            <SidebarMenuItem key={menuItem.id}>
                              {state === "collapsed" ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      {menuButton}
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                      {menuItem.label}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                menuButton
                              )}
                            </SidebarMenuItem>
                          );
                        }
                      })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : null}
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
      <div className="flex flex-1 relative">
        {/* Content Panel with SidebarInset */}
        <SidebarInset className="flex-1 relative">
          <PackageContentPanel
            currentHash={currentHash}
            packageSlug={packageSlug || undefined}
            packageName={appData?.name}
          >
            {children}
          </PackageContentPanel>
        </SidebarInset>

        {/* Agent Panel */}
        <div
          className={cn(
            "flex-shrink-0 transition-all duration-300 bg-background relative border-l",
            !agentPanelOpen && "w-0"
          )}
          style={{
            width: agentPanelOpen ? agentWidth || 320 : 0,
          }}
        >
          {agentPanelOpen && (
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
                <PackageAgentPanel
                  packageInfo={
                    appData
                      ? {
                          name: appData.name,
                          slug: appData.slug,
                          agentConfig: {
                            agentId: appData.agentId || "",
                            agentAliasId: appData.agentAliasId || "",
                            capabilities: [],
                          },
                        }
                      : undefined
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Toggle Button - bottom right positioning, 2x size */}
      <Button
        variant="outline"
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 p-0 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 z-[200]"
        onClick={handleToggleAgentPanel}
        title={agentPanelOpen ? "Close AI assistant" : "Open AI assistant"}
      >
        {agentPanelOpen ? (
          <ChevronRight className="h-8 w-8" />
        ) : (
          <Bot className="h-8 w-8" />
        )}
      </Button>
    </div>
  );
});

export function ThreePanelLayout({
  children,
  className,
  packageSource,
}: ThreePanelLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        <ThreePanelContent className={className} packageSource={packageSource}>{children}</ThreePanelContent>
      </SidebarProvider>
    </TooltipProvider>
  );
}
