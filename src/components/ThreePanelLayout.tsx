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
import {
  ChevronRight,
  ChevronLeft,
  Bot,
  Shield,
  Users,
  Plug,
  Settings,
  FileText,
  AlertTriangle,
  GitBranch,
  CheckCircle,
  Key,
  UserCheck,
  Database,
  Globe,
  Webhook,
  ChevronDown,
  LayoutDashboard,
  Building,
  Activity,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
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
  const { packageState, toggleAgentPanel, setAgentWidth } = usePackageContext();
  const [isResizingAgent, setIsResizingAgent] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const { toggleSidebar, state } = useSidebar();
  const [menuData, setMenuData] = useState<any>(null);
  const router = useRouter();

  // Icon mapping for menu items
  const iconMap: { [key: string]: any } = {
    Shield,
    Users,
    Plug,
    Settings,
    FileText,
    AlertTriangle,
    GitBranch,
    CheckCircle,
    Key,
    UserCheck,
    Database,
    Globe,
    Webhook,
    ChevronDown,
    // DynamoDB menu icons
    "layout-dashboard": LayoutDashboard,
    building: Building,
    users: Users,
    key: Key,
    settings: Settings,
    activity: Activity,
    "file-text": FileText,
  };

  // Handle navigation
  const handleNavigation = (route: string) => {
    // Navigate to the route specified in the menu item
    router.push(route);
  };

  // Load menu configuration from DynamoDB
  useEffect(() => {
    // Skip during SSR/build time
    if (typeof window === "undefined") {
      return;
    }

    const loadMenu = async () => {
      try {
        // Get current package/app from context (defaulting to "core")
        const currentApp = "core"; // This should come from context later
        console.log(`Loading menu for app: ${currentApp} from DynamoDB`);

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
        console.log("DynamoDB response:", result);

        if (
          result.success &&
          result.data &&
          result.data.Items &&
          result.data.Items.length > 0
        ) {
          const appData = result.data.Items[0];
          console.log("App data from DynamoDB:", appData);

          // Extract menu items from the app data
          if (appData.menu && Array.isArray(appData.menu)) {
            // Transform DynamoDB menu format to our expected format
            const menuStructure = {
              title: appData.name || "Application",
              version: appData.version || "1.0.0",
              sections: appData.menu.map((item: any) => ({
                id: item.id,
                title: item.label,
                icon: item.icon,
                route: item.href,
                type: "page",
                order: item.order,
              })),
            };

            console.log("Transformed menu structure:", menuStructure);
            setMenuData(menuStructure);
          } else if (appData.menuStructure) {
            // Handle complex nested menu structure (like from packages)
            console.log("Using complex menu structure:", appData.menuStructure);
            setMenuData(appData.menuStructure);
          } else {
            console.error("No menu items found in app data");
            setMenuData(null);
          }
        } else {
          console.error("No app found with slug:", currentApp);
          setMenuData(null);
        }
      } catch (error) {
        console.error("Failed to load menu from DynamoDB:", error);
        setMenuData(null);
      }
    };

    loadMenu();
  }, []);

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
                                    {iconMap[section.icon] &&
                                      React.createElement(
                                        iconMap[section.icon],
                                        { className: "h-4 w-4 flex-shrink-0" }
                                      )}
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
                                          {iconMap[item.icon] &&
                                            React.createElement(
                                              iconMap[item.icon],
                                              {
                                                className:
                                                  "h-4 w-4 flex-shrink-0",
                                              }
                                            )}
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
                                {iconMap[section.icon] &&
                                  React.createElement(iconMap[section.icon], {
                                    className: "h-4 w-4 flex-shrink-0",
                                  })}
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
                <div className="text-xs mt-1">Check console for details</div>
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
          <PackageContentPanel>{children}</PackageContentPanel>
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
