/**
 * Package Menu Panel Component using shadcn Sidebar
 * Dynamically loads menu structure from @captify/{package} menu export
 * Falls back to DynamoDB and error states as needed
 */

"use client";

import React, { useState, useEffect } from "react";
import { usePackageContext } from "../context/PackageContext";
import { cn } from "../lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
} from "./ui/sidebar";
import {
  Shield,
  FileText,
  AlertTriangle,
  GitBranch,
  CheckCircle,
  Award,
  Download,
  Users,
  User,
  Crown,
  Key,
  Database,
  Plug,
  Network,
  HardDrive,
  Bot,
  Settings,
  ChevronRight,
  Folder,
  FolderOpen,
} from "lucide-react";

// Icon mapping for the menu items
const iconMap = {
  Shield,
  FileText,
  AlertTriangle,
  GitBranch,
  CheckCircle,
  Award,
  Download,
  Users,
  UsersIcon: Users, // Alias for Users
  User,
  Crown,
  Key,
  Database,
  Plug,
  Network,
  HardDrive,
  Bot,
  Settings,
  ChevronRight,
  Folder,
  FolderOpen,
};

interface MenuSection {
  id: string;
  title: string;
  icon: string;
  type: "section" | "page";
  route?: string;
  items?: MenuSection[];
}

interface MenuStructure {
  title: string;
  version: string;
  sections: MenuSection[];
}

export function PackageMenuPanel() {
  const { packageState, packageConfig } = usePackageContext();
  const [menuData, setMenuData] = useState<MenuStructure | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  // Load menu configuration
  useEffect(() => {
    const loadMenuData = async () => {
      try {
        // Try to load from DynamoDB first
        if (packageConfig?.name) {
          try {
            // This will be implemented to load from DynamoDB
            // const response = await apiClient.run({
            //   service: "dynamodb",
            //   operation: "get",
            //   table: "package_configurations",
            //   data: {
            //     key: {
            //       packageName: packageConfig.name,
            //       configType: "menu"
            //     }
            //   }
            // });
            //
            // if (response.success && response.data) {
            //   setMenuData(response.data.data);
            //   return;
            // }
          } catch (error) {
            console.warn(
              "Failed to load menu from DynamoDB, falling back to package data:",
              error
            );
          }
        }

        // Dynamic import from package app
        if (packageConfig?.name) {
          try {
            const packageName = `@captify/${packageConfig.name}/app`;
            console.log(`Loading menu from ${packageName}`);

            // Dynamic import the menu from the package app
            const packageModule = await import(packageName);

            if (packageModule.menu) {
              console.log(
                `Successfully loaded menu from ${packageName}`,
                packageModule.menu
              );
              setMenuData(packageModule.menu.menuStructure);

              // Auto-expand the first section if it has items
              const firstSection =
                packageModule.menu.menuStructure?.sections?.[0];
              if (
                firstSection &&
                firstSection.type === "section" &&
                firstSection.items
              ) {
                setExpandedSections(new Set([firstSection.id]));
              }
              return;
            } else {
              console.warn(`No menu export found in ${packageName}`);
            }
          } catch (error) {
            console.warn(
              `Failed to dynamically import menu from @captify/${packageConfig.name}/app:`,
              error
            );
          }
        }

        // Final fallback - show empty menu with error message
        console.warn("No menu configuration found, using empty fallback");
        setMenuData({
          title: packageConfig?.name
            ? `${packageConfig.name} Package`
            : "Unknown Package",
          version: "1.0.0",
          sections: [
            {
              id: "no-menu",
              title: "No Menu Available",
              icon: "AlertTriangle",
              type: "page",
              route: "error",
            },
          ],
        });
      } catch (error) {
        console.error("Failed to load menu data:", error);
        // Error fallback
        setMenuData({
          title: "Error Loading Menu",
          version: "1.0.0",
          sections: [
            {
              id: "error-menu",
              title: "Menu Load Error",
              icon: "AlertTriangle",
              type: "page",
              route: "error",
            },
          ],
        });
      }
    };

    loadMenuData();
  }, [packageConfig]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleNavigate = (route: string) => {
    window.location.hash = route;
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent ? (
      <IconComponent className="h-4 w-4" />
    ) : (
      <Folder className="h-4 w-4" />
    );
  };

  const renderMenuItem = (item: MenuSection) => {
    const isActive = packageState.currentRoute === item.route;

    if (item.type === "page" && item.route) {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            onClick={() => handleNavigate(item.route!)}
            isActive={isActive}
            className="w-full"
          >
            {getIcon(item.icon)}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return null;
  };

  const renderSection = (section: MenuSection) => {
    const isExpanded = expandedSections.has(section.id);

    if (section.type === "page") {
      // This is a standalone page, not a section
      return renderMenuItem(section);
    }

    return (
      <SidebarGroup key={section.id}>
        <SidebarGroupLabel asChild>
          <button
            onClick={() => toggleSection(section.id)}
            className="flex w-full items-center justify-between px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          >
            <div className="flex items-center gap-2">
              {getIcon(section.icon)}
              <span>{section.title}</span>
            </div>
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </button>
        </SidebarGroupLabel>

        {isExpanded && section.items && (
          <SidebarGroupContent>
            <SidebarMenu>{section.items.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        )}
      </SidebarGroup>
    );
  };

  if (!menuData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <SidebarHeader className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{menuData.title}</span>
            <span className="text-xs text-muted-foreground">
              v{menuData.version}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <div className="space-y-2">{menuData.sections.map(renderSection)}</div>
      </SidebarContent>
    </div>
  );
}
