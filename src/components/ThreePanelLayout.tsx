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

interface ThreePanelLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

// Inner component that has access to SidebarProvider context
function ThreePanelContent({ children, className }: ThreePanelLayoutProps) {
  const { packageState, toggleAgentPanel, setAgentWidth, packageConfig } =
    usePackageContext();
  const [isResizingAgent, setIsResizingAgent] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const { toggleSidebar, state } = useSidebar();
  const [menuData, setMenuData] = useState<any>(null);
  const [currentHash, setCurrentHash] = useState<string>(() => {
    // Initialize with current hash from URL, fallback to "home"
    if (typeof window !== "undefined") {
      const initialHash = window.location.hash.slice(1) || "home";
      return initialHash;
    }
    return "home";
  });
  const router = useRouter();
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

  // Load menu configuration from DynamoDB
  useEffect(() => {
    // Skip during SSR/build time
    if (typeof window === "undefined") {
      return;
    }

    // Don't load menu until packageConfig is available
    if (!packageConfig) {
      return;
    }

    const loadMenu = async () => {
      try {
        // Get the current app slug from packageConfig
        const currentApp = packageConfig.slug;
        // Query DynamoDB for the app data using the slug-index
        const response = await fetch("/api/captify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-app": "core", // Required header for the API
          },
          body: JSON.stringify({
            service: "dynamo",
            operation: "query",
            table: "App",
            data: {
              IndexName: "slug-index",
              KeyConditionExpression: "slug = :slug",
              ExpressionAttributeValues: {
                ":slug": currentApp,
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (
          result.success &&
          result.data &&
          result.data.Items &&
          result.data.Items.length > 0
        ) {
          const appData = result.data.Items[0];

          // Extract menu items from the app data
          if (appData.menu && Array.isArray(appData.menu)) {
            // Transform DynamoDB menu format to our expected format
            const menuStructure = {
              title: appData.name || "Application",
              version: appData.version || "1.0.0",
              sections: appData.menu.map((item: any) => {
                const section: any = {
                  id: item.id,
                  title: item.label,
                  icon: item.icon,
                  route: item.href,
                  type: "page",
                  order: item.order,
                };

                // Check if this item has children (nested menu items)
                if (
                  item.children &&
                  Array.isArray(item.children) &&
                  item.children.length > 0
                ) {
                  section.items = item.children.map((child: any) => ({
                    id: child.id,
                    title: child.label,
                    icon: child.icon,
                    route: child.href,
                    type: "page",
                    order: child.order,
                  }));
                }

                return section;
              }),
            };
            setMenuData(menuStructure);
          } else if (appData.menuStructure) {
            // Handle complex nested menu structure (like from packages)
            setMenuData(appData.menuStructure);
          } else {
            setMenuData(null);
          }
        } else {
          setMenuData(null);
        }
      } catch (error) {
        setMenuData(null);
      }
    };

    loadMenu();
  }, [packageConfig]); // Use the entire packageConfig object, not just the slug

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
            {menuData && menuData.sections ? (
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuData.sections.map((section: any) => {
                      // Check if section has items (collapsible) or is a direct button
                      const hasItems =
                        section.items && section.items.length > 0;

                      if (hasItems) {
                        // Complex structure: Collapsible section with sub-items
                        return (
                          <Collapsible
                            key={section.id}
                            defaultOpen={true}
                            className="group/collapsible"
                          >
                            <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <DynamicIcon
                                      name={section.icon}
                                      className="h-4 w-4 flex-shrink-0"
                                    />
                                    <span className="truncate">
                                      {section.title}
                                    </span>
                                  </div>
                                  <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenuSub>
                                  {section.items.map((item: any) => (
                                    <SidebarMenuSubItem key={item.id}>
                                      <SidebarMenuSubButton
                                        onClick={() =>
                                          handleNavigation(
                                            item.route ||
                                              item.href ||
                                              `#${item.id}`
                                          )
                                        }
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <DynamicIcon
                                            name={item.icon}
                                            className="h-4 w-4 flex-shrink-0"
                                          />
                                          <span className="truncate">
                                            {item.title}
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
                        // Simple structure: Direct button for sections without items
                        return (
                          <SidebarMenuItem key={section.id}>
                            <SidebarMenuButton
                              onClick={() =>
                                handleNavigation(
                                  section.route ||
                                    section.href ||
                                    `#${section.id}`
                                )
                              }
                              className="flex items-center gap-2 w-full"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <DynamicIcon
                                  name={section.icon}
                                  className="h-4 w-4 flex-shrink-0"
                                />
                                <span className="truncate">
                                  {section.title}
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
            ) : menuData === null ? (
              <div className="p-4 text-sm text-muted-foreground">
                <div>Menu failed to load</div>
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                Loading menu...
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
