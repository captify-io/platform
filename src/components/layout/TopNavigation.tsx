"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useApps } from "@/context/AppsContext";
import {
  Search,
  Grid3X3,
  Settings,
  Bell,
  ExternalLink,
  Loader2,
  Plane,
  Wrench,
  BarChart3,
  Database,
  Zap,
  Package,
  Hammer,
  Target,
  DollarSign,
  Bot,
  User,
  LogOut,
  ChevronDown,
  Star,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useDebounce } from "@/hooks/useDebounce";

interface FavoriteApplication {
  id: string; // UUID
  appId: string; // Slug
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
}

interface TopNavigationProps {
  onSearchFocus: () => void;
  onApplicationMenuClick: () => void;
  currentApplication?: {
    id: string;
    name: string;
  };
}

// Helper functions to map app IDs to UI elements
const getIconForApp = (
  appId: string
): React.ComponentType<{ className?: string }> => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "aircraft-console": Plane,
    "materiel-insights": Wrench,
    dataops: Database,
    "express-dashboard": BarChart3,
    mescip: Zap,
    "supply-chain": Package,
    "financial-forecasting-advisor": DollarSign,
    "marketing-advisor": Target,
    "tool-management": Hammer,
    console: Settings, // Add console mapping
  };
  return iconMap[appId] || Bot; // Default to Bot icon
};

const getColorForApp = (appId: string): string => {
  const colorMap: Record<string, string> = {
    "aircraft-console": "bg-chart-1",
    "materiel-insights": "bg-chart-2",
    dataops: "bg-chart-3",
    "express-dashboard": "bg-chart-4",
    mescip: "bg-chart-5",
    "supply-chain": "bg-destructive",
    "financial-forecasting-advisor": "bg-primary",
    "marketing-advisor": "bg-secondary",
    "tool-management": "bg-accent",
    console: "bg-blue-600", // Add console mapping
  };
  return colorMap[appId] || "bg-muted-foreground"; // Default color
};

export function TopNavigation({
  onSearchFocus,
  onApplicationMenuClick, // eslint-disable-line @typescript-eslint/no-unused-vars
  currentApplication,
}: TopNavigationProps) {
  const { data: session } = useSession();
  const { applications, favoriteApps, toggleFavorite, loading } = useApps();
  const router = useRouter();
  const [applicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const applicationMenuRef = useRef<HTMLDivElement>(null);

  // Transform favoriteApps (app IDs) to FavoriteApplication objects
  const favoriteApplications: FavoriteApplication[] = favoriteApps
    .map((appId) => {
      // appId here is now a UUID, find by app.id
      const app = applications.find((a) => a.id === appId);
      if (!app) return null;

      const appSlug = app.slug || app.app_id || app.id;
      const appName =
        app.name || app.title || app.metadata?.name || "Unknown App";

      // Check if app has a direct route (based on slug)
      // Apps with direct routes: /mi, /console, etc.
      const hasDirectRoute = ["mi", "console"].includes(appSlug);
      const href = hasDirectRoute ? `/${appSlug}` : `/apps/${app.id}`;

      return {
        id: app.id, // Use UUID for comparison
        appId: appSlug, // Keep slug for other purposes
        name: appName,
        icon: getIconForApp(appSlug),
        color: getColorForApp(appSlug),
        href: href, // Use direct route if available, otherwise UUID route
      };
    })
    .filter(Boolean) as FavoriteApplication[];

  // Close application menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        applicationMenuRef.current &&
        !applicationMenuRef.current.contains(event.target as Node)
      ) {
        setApplicationMenuOpen(false);
      }
    }

    if (applicationMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [applicationMenuOpen]);

  // Unified search integration
  const { results, isLoading, error, search, clearResults } =
    useUnifiedSearch();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      search(debouncedSearchQuery);
    } else {
      clearResults();
    }
  }, [debouncedSearchQuery, search, clearResults]);

  // Helper function to check if an app is favorited
  const isAppFavorited = (appId: string): boolean => {
    return favoriteApps.includes(appId);
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    onSearchFocus();
  };

  const handleSearchBlur = () => {
    // Delay hiding to allow clicking on dropdown items
    setTimeout(() => setSearchFocused(false), 200);
  };

  const handleSearchItemClick = (item: { url: string; title: string }) => {
    setSearchFocused(false);
    setSearchQuery("");
    clearResults();

    // Navigate to the selected item
    if (item.url.startsWith("/")) {
      router.push(item.url);
    } else if (item.url.startsWith("http")) {
      window.open(item.url, "_blank");
    } else {
      // Handle AWS console URLs
      router.push(`/console${item.url}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchFocused(false);
      setSearchQuery("");
      clearResults();
    }
  };

  return (
    <div ref={applicationMenuRef}>
      {/* Main Top Bar */}
      <div className="bg-black text-white">
        <div className="flex items-center justify-between px-4 h-12">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 relative">
              <span className="font-medium">
                <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]">
                  AFSC
                </span>
                <span className="text-white ml-1">TITAN</span>
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setApplicationMenuOpen(!applicationMenuOpen)}
                className="text-white hover:bg-gray-800 hover:text-white p-1 cursor-pointer"
              >
                <Grid3X3 className="h-3 w-3" />
              </Button>

              {/* Application Menu Dropdown */}
              {applicationMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-96 bg-popover border border-border shadow-lg z-50 max-h-96 overflow-y-auto rounded-lg">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-popover-foreground mb-4">
                      Available Applications
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {applications.map((app) => {
                        const isActive =
                          currentApplication?.id === (app.slug || app.app_id); // Compare slugs for active state
                        const isFavorite = isAppFavorited(app.id); // Use UUID for favorite state
                        const IconComponent = getIconForApp(
                          app.slug || app.app_id || app.id
                        );
                        return (
                          <div
                            key={app.slug || app.app_id || app.id}
                            className={`flex items-start space-x-3 p-3 rounded-lg border relative ${
                              isActive
                                ? "bg-accent border-accent hover:bg-accent/80"
                                : "border-border hover:bg-muted hover:border-muted-foreground/20"
                            }`}
                          >
                            {/* Star Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("⭐ Star clicked:", {
                                  appId: app.id, // Log UUID
                                  isFavorite,
                                });
                                toggleFavorite(app.id); // Use UUID for toggle
                              }}
                              className={`absolute top-2 right-2 p-1 rounded-full transition-colors cursor-pointer hover:bg-muted ${
                                isFavorite
                                  ? "text-yellow-500 hover:text-yellow-600"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              title={
                                isFavorite
                                  ? "Remove from favorites"
                                  : "Add to favorites"
                              }
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  isFavorite ? "fill-current" : ""
                                }`}
                              />
                            </button>

                            {/* Application Content - Clickable */}
                            <div
                              onClick={() => {
                                const appSlug =
                                  app.slug || app.app_id || app.id;
                                const hasDirectRoute = [
                                  "mi",
                                  "console",
                                ].includes(appSlug);
                                const href = hasDirectRoute
                                  ? `/${appSlug}`
                                  : `/apps/${app.id}`;
                                router.push(href);
                                setApplicationMenuOpen(false);
                              }}
                              className="flex items-start space-x-3 flex-1 cursor-pointer"
                            >
                              <div
                                className={`w-10 h-10 rounded-lg ${getColorForApp(
                                  app.slug || app.app_id || app.id
                                )} flex items-center justify-center text-white flex-shrink-0`}
                              >
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0 pr-8">
                                <h4
                                  className={`text-sm font-medium truncate ${
                                    isActive
                                      ? "text-accent-foreground"
                                      : "text-popover-foreground"
                                  }`}
                                >
                                  {app.name || app.title || app.metadata?.name}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {app.description || app.metadata?.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 mx-8 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for services, applications, and resources"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 pr-20 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {isLoading && (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                )}
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                  Alt+S
                </span>
              </div>
            </div>

            {/* Search Dropdown */}
            {searchFocused && (searchQuery.trim() || results) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                {error ? (
                  <div className="p-4 text-center text-destructive">
                    <div className="text-sm font-medium">Search Error</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {error}
                    </div>
                  </div>
                ) : results ? (
                  <div className="py-2">
                    {results.sections.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <div className="text-sm">No results found</div>
                        <div className="text-xs text-muted-foreground/80 mt-1">
                          Try searching for AWS services like
                          &quot;lambda&quot;, &quot;s3&quot;, or
                          &quot;cognito&quot;
                        </div>
                      </div>
                    ) : (
                      results.sections.map((section) => (
                        <div key={section.provider} className="mb-2 last:mb-0">
                          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                            {section.sectionTitle} ({section.totalCount})
                          </div>
                          <div className="space-y-1">
                            {section.results.map((item, index) => (
                              <div
                                key={`${section.provider}-${item.serviceId}-${index}`}
                                onClick={() => handleSearchItemClick(item)}
                                className="flex items-start space-x-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                              >
                                <div className="flex-shrink-0 mt-1">
                                  {item.source === "aws" ? (
                                    <div className="w-6 h-6 bg-chart-4 rounded text-white text-xs flex items-center justify-center font-bold">
                                      AWS
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 bg-chart-1 rounded text-white text-xs flex items-center justify-center">
                                      <ExternalLink className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-popover-foreground truncate">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {item.description}
                                  </div>
                                  {item.topServiceFeatures &&
                                    item.topServiceFeatures.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {item.topServiceFeatures
                                          .slice(0, 3)
                                          .map((feature, idx) => (
                                            <span
                                              key={idx}
                                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                                            >
                                              {feature}
                                            </span>
                                          ))}
                                      </div>
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}

                    {results.suggestions && results.suggestions.length > 0 && (
                      <div className="border-t border-border pt-2 mt-2">
                        <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                          Suggestions
                        </div>
                        <div className="px-3 py-2 text-xs text-muted-foreground/80 space-y-1">
                          {results.suggestions.map((suggestion, index) => (
                            <div key={index}>{suggestion}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : searchQuery.trim() && isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    <div className="text-sm">Searching...</div>
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <div className="text-sm">Start typing to search</div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-800 hover:text-white p-1 cursor-pointer"
            >
              <Bell className="h-4 w-4" />
            </Button>

            {/* Token Counter */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded-md border border-gray-700">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">4,600</span>
              <span className="text-xs text-gray-400">tokens</span>
            </div>

            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 text-white hover:bg-gray-800 hover:text-white px-3 py-2 h-auto"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={session?.user?.image || undefined}
                        alt={session?.user?.name || "User"}
                      />
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {session?.user?.name &&
                        session?.user?.name !== session?.user?.email
                          ? session.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : session?.user?.email
                              ?.split("@")[0]
                              ?.slice(0, 2)
                              ?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">
                        {session?.user?.name ||
                          session?.user?.email?.split("@")[0] ||
                          "User"}
                      </span>
                      {session?.user?.email && (
                        <span className="text-xs text-gray-300">
                          {session.user.email}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={session?.user?.image || undefined}
                          alt={session?.user?.name || "User"}
                        />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {session?.user?.name &&
                          session?.user?.name !== session?.user?.email
                            ? session.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : session?.user?.email
                                ?.split("@")[0]
                                ?.slice(0, 2)
                                ?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-popover-foreground">
                          {session?.user?.name ||
                            session?.user?.email?.split("@")[0] ||
                            "User"}
                        </span>
                        {session?.user?.email && (
                          <span className="text-sm text-muted-foreground">
                            {session.user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/admin")}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Platform Admin</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/auth/signout")}
                    className="flex items-center space-x-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Favorites Bar */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="flex items-center px-4 h-10 space-x-1">
          {loading ? (
            <div className="flex items-center space-x-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Loading favorites...</span>
            </div>
          ) : favoriteApplications.length === 0 ? (
            <div className="text-gray-400 text-xs">
              No favorites yet - star applications to add them here
            </div>
          ) : (
            favoriteApplications.map((app: FavoriteApplication) => {
              const isActive = currentApplication?.id === app.id;
              const IconComponent = app.icon;
              return (
                <Button
                  key={app.appId}
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(app.href)}
                  className={`transition-all duration-200 text-xs px-3 py-1 h-8 flex items-center space-x-2 cursor-pointer ${
                    isActive
                      ? "bg-gray-800 text-white border border-gray-600"
                      : "text-white hover:bg-gray-800 hover:text-white border border-transparent hover:border-gray-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center ${app.color}`}
                  >
                    <IconComponent className="h-3 w-3 text-white" />
                  </div>
                  <span>{app.name}</span>
                </Button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
