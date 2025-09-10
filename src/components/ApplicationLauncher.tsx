"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "../lib/api";
import { cn } from "../lib/utils";
import { 
  Button, 
  Badge, 
  ScrollArea, 
  Input,
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "./ui";
import { DynamicIcon } from "lucide-react/dynamic";
import { Grid3X3, Star, Search } from "lucide-react";
import { useFavorites } from "../hooks/useFavorites";
import type { Session } from "next-auth";

// Type definitions
export interface App {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  category?: string;
  url?: string;
  status?: string;
  cloudProvider?: string;
  region?: string;
  environment?: string;
}

export type AppCategory = 
  | "core"
  | "analytics"
  | "communication"
  | "storage"
  | "compute"
  | "database"
  | "security"
  | "monitoring"
  | "networking"
  | "ai_ml"
  | "development"
  | "other";

export const APP_CATEGORY_LABELS: Record<AppCategory, string> = {
  core: "Core Services",
  analytics: "Analytics",
  communication: "Communication",
  storage: "Storage",
  compute: "Compute",
  database: "Database",
  security: "Security",
  monitoring: "Monitoring",
  networking: "Networking",
  ai_ml: "AI/ML",
  development: "Development",
  other: "Other",
};

type FilterType = 
  | "favorites" 
  | "all-applications" 
  | "all-services"
  | AppCategory;

interface ApplicationLauncherProps {
  className?: string;
  session: Session | null;
  variant?: "compact" | "aws";
}

// Left sidebar navigation item component (AWS variant)
function NavItem({
  label,
  icon,
  isActive,
  count,
  onClick,
  type = "default",
}: {
  label: string;
  icon: string;
  isActive: boolean;
  count?: number;
  onClick: () => void;
  type?: "default" | "divider-after";
}) {
  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
          isActive
            ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        )}
      >
        <div className="flex items-center gap-2">
          <DynamicIcon name={icon as any} className="h-4 w-4" />
          <span>{label}</span>
        </div>
        {count !== undefined && (
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        )}
      </button>
      {type === "divider-after" && (
        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
      )}
    </>
  );
}

// Compact App Card Component
function CompactAppCard({
  app,
  isFavorite,
  onToggleFavorite,
  onAppClick,
}: {
  app: App;
  isFavorite: boolean;
  onToggleFavorite: (appId: string) => void;
  onAppClick: (app: App) => void;
}) {
  return (
    <div
      className="group relative flex items-center space-x-2 p-1.5 hover:bg-accent/50 cursor-pointer transition-all duration-200 rounded-md border border-transparent hover:border-border/50"
      onClick={() => onAppClick(app)}
    >
      {/* App Icon */}
      <div className="relative">
        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-border group-hover:border-blue-500/30 transition-all duration-200">
          <DynamicIcon
            name={(app.icon || "package") as any}
            className="h-4 w-4 text-blue-600 group-hover:text-blue-700 transition-colors"
          />
        </div>
        {isFavorite && (
          <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-xs text-foreground group-hover:text-primary transition-colors truncate">
              {app.name}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0">
              {app.description || "Application description not available"}
            </p>
            <div className="flex items-center mt-0.5">
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {(app.category && APP_CATEGORY_LABELS[app.category as AppCategory]) ||
                  (app.category ? app.category.charAt(0).toUpperCase() + app.category.slice(1) : "Other")}
              </Badge>
            </div>
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onToggleFavorite(app.id);
            }}
            className={`ml-1 h-6 w-6 p-0 transition-all duration-200 self-start ${
              isFavorite
                ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                : "text-muted-foreground hover:text-yellow-500 hover:bg-accent"
            }`}
          >
            <Star
              className={`h-3.5 w-3.5 transition-all duration-200 ${
                isFavorite ? "fill-current" : ""
              }`}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

// AWS-style App Card Component
function AWSAppCard({
  app,
  isFavorite,
  onToggleFavorite,
  onAppClick,
}: {
  app: App;
  isFavorite: boolean;
  onToggleFavorite: (appId: string) => void;
  onAppClick: (app: App) => void;
}) {
  return (
    <div
      className="group p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all duration-200 bg-white dark:bg-gray-800"
      onClick={() => onAppClick(app)}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-gray-200 dark:border-gray-600 flex-shrink-0">
          <DynamicIcon
            name={(app.icon || "package") as any}
            className="h-6 w-6 text-blue-600"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 truncate pr-2">
              {app.name}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                onToggleFavorite(app.id);
              }}
              className={cn(
                "h-6 w-6 p-0 flex-shrink-0",
                isFavorite
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-gray-400 hover:text-yellow-500"
              )}
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {app.description || "No description available"}
          </p>
          <Badge variant="secondary" className="text-xs">
            {APP_CATEGORY_LABELS[app.category as AppCategory] || "Other"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function ApplicationLauncher({
  className,
  session,
  variant = "compact",
}: ApplicationLauncherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { favoriteApps: favorites, toggleFavorite } = useFavorites();
  
  const [isOpen, setIsOpen] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all-applications");

  // Fetch applications
  useEffect(() => {
    const fetchApps = async () => {
      if (!session?.user) return;
      
      setLoading(true);
      try {
        const result = await apiClient.run({
          service: "application",
          operation: "listApplications",
        });
        
        if (result.success && result.data) {
          setApps(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch applications:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchApps();
    }
  }, [isOpen, session]);

  // Toggle favorite
  const handleToggleFavorite = useCallback((appId: string) => {
    toggleFavorite(appId);
  }, [toggleFavorite]);

  // Handle app click
  const handleAppClick = useCallback((app: App) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("app", app.slug);
    router.push(`/?${newParams.toString()}`);
    setIsOpen(false);
  }, [router, searchParams]);

  // Filter apps based on search and active filter
  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeFilter === "favorites") {
      return favorites.includes(app.id);
    } else if (activeFilter === "all-applications" || activeFilter === "all-services") {
      return true;
    } else {
      return app.category === activeFilter;
    }
  });

  // Get category counts
  const getCategoryCount = (category: AppCategory) => {
    return apps.filter(app => app.category === category).length;
  };

  const renderCompactView = () => (
    <SheetContent
      side="left"
      className="w-[400px] sm:w-[450px] p-0 overflow-hidden"
    >
      <div className="flex flex-col h-full">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle className="text-base">Application Launcher</SheetTitle>
          <div className="relative mt-2">
            <Input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-0.5">
            {loading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Loading applications...
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No applications found
              </div>
            ) : (
              filteredApps.map((app) => (
                <CompactAppCard
                  key={app.id}
                  app={app}
                  isFavorite={favorites.includes(app.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onAppClick={handleAppClick}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </SheetContent>
  );

  const renderAWSView = () => (
    <SheetContent 
      side="left" 
      className="w-full sm:max-w-4xl p-0 overflow-hidden"
    >
      <div className="flex h-full">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <SheetTitle className="text-lg font-semibold">Services</SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <div className="p-3 space-y-1">
              <NavItem
                label="Favorites"
                icon="star"
                isActive={activeFilter === "favorites"}
                count={favorites.length}
                onClick={() => setActiveFilter("favorites")}
                type="divider-after"
              />
              
              <NavItem
                label="All Applications"
                icon="grid-3x3"
                isActive={activeFilter === "all-applications"}
                count={apps.length}
                onClick={() => setActiveFilter("all-applications")}
              />
              
              <NavItem
                label="All Services"
                icon="layers"
                isActive={activeFilter === "all-services"}
                count={apps.length}
                onClick={() => setActiveFilter("all-services")}
                type="divider-after"
              />
              
              {Object.entries(APP_CATEGORY_LABELS).map(([key, label]) => (
                <NavItem
                  key={key}
                  label={label}
                  icon={getCategoryIcon(key as AppCategory)}
                  isActive={activeFilter === key}
                  count={getCategoryCount(key as AppCategory)}
                  onClick={() => setActiveFilter(key as FilterType)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col">
          <div className="px-6 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {activeFilter === "favorites" && "Favorites"}
                {activeFilter === "all-applications" && "All Applications"}
                {activeFilter === "all-services" && "All Services"}
                {APP_CATEGORY_LABELS[activeFilter as AppCategory]}
              </h2>
              <Badge variant="secondary">
                {filteredApps.length} {filteredApps.length === 1 ? "item" : "items"}
              </Badge>
            </div>
            
            <div className="relative">
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading applications...
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery 
                  ? `No results found for "${searchQuery}"`
                  : "No applications in this category"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredApps.map((app) => (
                  <AWSAppCard
                    key={app.id}
                    app={app}
                    isFavorite={favorites.includes(app.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onAppClick={handleAppClick}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </SheetContent>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("flex items-center gap-2", className)}
        >
          <Grid3X3 className="h-4 w-4" />
          <span>Applications</span>
        </Button>
      </SheetTrigger>
      
      {variant === "aws" ? renderAWSView() : renderCompactView()}
    </Sheet>
  );
}

// Helper function to get icon for category
function getCategoryIcon(category: AppCategory): string {
  const iconMap: Record<AppCategory, string> = {
    core: "cpu",
    analytics: "bar-chart",
    communication: "message-circle",
    storage: "hard-drive",
    compute: "server",
    database: "database",
    security: "shield",
    monitoring: "activity",
    networking: "network",
    ai_ml: "brain",
    development: "code",
    other: "package",
  };
  return iconMap[category] || "package";
}